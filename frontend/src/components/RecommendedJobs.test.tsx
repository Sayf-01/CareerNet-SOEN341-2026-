import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import RecommendedJobs from "./RecommendedJobs";
import { ApiError } from "../api/client";
import { getRecommendations } from "../api/recommendations";
import { useAuth } from "../context/useAuth";
import type { RecommendationList } from "../types/recommendation";

// fake the API and the logged-in user, so no backend is needed
vi.mock("../api/recommendations");
vi.mock("../context/useAuth");

const TWO_JOBS: RecommendationList = {
  items: [
    {
      job_id: 7,
      title: "Frontend Intern",
      company: "Acme",
      location: "Montreal",
      category: "Software",
      score: 88,
      reasons: ["Your React skills match the posting.", "Located in your city."],
    },
    {
      job_id: 9,
      title: "QA Tester",
      company: "Globex",
      location: "Remote",
      category: "Testing",
      score: 45,
      reasons: ["You listed unit testing."],
    },
  ],
  mode: "ai",
  resume_used: true,
  message: null,
};

function loginAs(role: "JOB_SEEKER" | "RECRUITER") {
  vi.mocked(useAuth).mockReturnValue({
    token: "t",
    user: { id: 1, full_name: "Dany", email: "dany@example.com", role },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  });
}

function renderPanel() {
  return render(
    <MemoryRouter>
      <RecommendedJobs />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  loginAs("JOB_SEEKER");
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("RecommendedJobs", () => {
  it("shows each job with score, reasons and a link to the job", async () => {
    vi.mocked(getRecommendations).mockResolvedValue(TWO_JOBS);
    renderPanel();

    expect(await screen.findByText("Frontend Intern")).toBeInTheDocument();
    expect(screen.getByText("Acme · Montreal")).toBeInTheDocument();
    expect(screen.getByLabelText("Match score 88 out of 100")).toHaveTextContent("88% match");
    expect(screen.getByText("Your React skills match the posting.")).toBeInTheDocument();
    expect(screen.getByText("Located in your city.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View job: Frontend Intern" })).toHaveAttribute("href", "/jobs/7");
    expect(screen.getByRole("link", { name: "View job: QA Tester" })).toHaveAttribute("href", "/jobs/9");
    expect(screen.getByText("Based on your profile and latest resume.")).toBeInTheDocument();
  });

  it.each([
    ["ai", "AI match"],
    ["fake", "AI match"],
    ["fallback", "Keyword match"],
  ] as const)("labels mode %s as %s", async (mode, label) => {
    vi.mocked(getRecommendations).mockResolvedValue({ ...TWO_JOBS, mode });
    renderPanel();

    await screen.findByText("Frontend Intern");
    // one label per card
    expect(screen.getAllByText(label)).toHaveLength(2);
    const otherLabel = label === "AI match" ? "Keyword match" : "AI match";
    expect(screen.queryByText(otherLabel)).not.toBeInTheDocument();
  });

  it("shows the loading skeleton while waiting", () => {
    vi.mocked(getRecommendations).mockReturnValue(new Promise(() => {})); // never answers
    renderPanel();

    expect(screen.getByRole("status", { name: "Loading recommendations" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeDisabled();
  });

  it("shows No matches yet when there are no items", async () => {
    vi.mocked(getRecommendations).mockResolvedValue({
      items: [], mode: "ai", resume_used: false, message: "No matching jobs found yet.",
    });
    renderPanel();

    expect(await screen.findByText("No matches yet")).toBeInTheDocument();
    expect(screen.getByText("No matching jobs found yet.")).toBeInTheDocument();
  });

  it("asks for a profile and links to it on 409", async () => {
    vi.mocked(getRecommendations).mockRejectedValue(
      new ApiError("Add skills or a headline to your profile first.", 409),
    );
    renderPanel();

    expect(await screen.findByText(/Add skills or a headline to your profile first\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to your profile" })).toHaveAttribute("href", "/profile");
  });

  it("shows the limit message on 429", async () => {
    vi.mocked(getRecommendations).mockRejectedValue(
      new ApiError("You have used your hourly AI limit. Please try again later.", 429),
    );
    renderPanel();

    expect(await screen.findByText("AI request limit reached. Try again later.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("shows other errors with a Try again button that asks again", async () => {
    vi.mocked(getRecommendations)
      .mockRejectedValueOnce(new Error("Unable to connect to the server. Please try again."))
      .mockResolvedValueOnce(TWO_JOBS);
    renderPanel();

    expect(await screen.findByText("Unable to connect to the server. Please try again.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Frontend Intern")).toBeInTheDocument();
    expect(getRecommendations).toHaveBeenCalledTimes(2);
  });

  it("Refresh calls the API exactly once per click", async () => {
    vi.mocked(getRecommendations).mockResolvedValue(TWO_JOBS);
    renderPanel();
    await screen.findByText("Frontend Intern");
    expect(getRecommendations).toHaveBeenCalledTimes(1);

    const refresh = screen.getByRole("button", { name: "Refresh" });
    fireEvent.click(refresh);
    fireEvent.click(refresh); // second click while loading is ignored

    await screen.findByText("Frontend Intern");
    expect(getRecommendations).toHaveBeenCalledTimes(2);
  });

  it("sends only one request on open, even in StrictMode", async () => {
    vi.mocked(getRecommendations).mockResolvedValue(TWO_JOBS);
    render(
      <StrictMode>
        <MemoryRouter>
          <RecommendedJobs />
        </MemoryRouter>
      </StrictMode>,
    );

    expect(await screen.findByText("Frontend Intern")).toBeInTheDocument();
    expect(getRecommendations).toHaveBeenCalledTimes(1);
  });

  it("is hidden for recruiters and sends no request", () => {
    loginAs("RECRUITER");
    const { container } = renderPanel();

    expect(container).toBeEmptyDOMElement();
    expect(getRecommendations).not.toHaveBeenCalled();
  });
});
