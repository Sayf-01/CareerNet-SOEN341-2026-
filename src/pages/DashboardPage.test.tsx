import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import DashboardPage from "./DashboardPage";
import { getApplicationActivity, getApplicationSummary } from "../api/analytics";
import { getMyApplications } from "../api/myApplications";
import { useAuth } from "../context/useAuth";

// fake the API and the logged-in user, so no backend is needed
vi.mock("../api/analytics");
vi.mock("../api/myApplications");
vi.mock("../context/useAuth");

const ZERO = { Applied: 0, "Under Review": 0, Interview: 0, Offered: 0, Rejected: 0 };

function loginAs(role: "JOB_SEEKER" | "RECRUITER") {
  vi.mocked(useAuth).mockReturnValue({
    token: "t",
    user: { id: 1, full_name: "Dany", email: "dany@example.com", role },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  loginAs("JOB_SEEKER");
  vi.mocked(getApplicationActivity).mockResolvedValue({
    days: 30,
    points: [
      { date: "2026-11-11", count: 1 },
      { date: "2026-11-12", count: 3 },
    ],
  });
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("DashboardPage", () => {
  it("shows the counts, the chart total and the latest applications", async () => {
    vi.mocked(getApplicationSummary).mockResolvedValue({
      total: 4,
      by_status: { ...ZERO, Applied: 2, "Under Review": 1, Interview: 1 },
    });
    vi.mocked(getMyApplications).mockResolvedValue([
      { id: 1, job_title: "Backend Intern", company: "Acme", status: "Interview",
        applied_at: "2026-11-12T10:00:00Z", updated_at: "2026-11-12T10:00:00Z" },
    ]);

    renderPage();

    expect(await screen.findByText("Total applications: 4")).toBeInTheDocument();
    expect(within(screen.getByTestId("status-row-Applied")).getByText("2")).toBeInTheDocument();
    expect(screen.getByText("4 applications in the last 2 days")).toBeInTheDocument();
    expect(screen.getByText("Backend Intern")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See all applications" })).toHaveAttribute("href", "/applications");
  });

  it("shows zeros and a link to browse jobs for a new job seeker", async () => {
    vi.mocked(getApplicationSummary).mockResolvedValue({ total: 0, by_status: ZERO });
    vi.mocked(getMyApplications).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("Total applications: 0")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse jobs" })).toHaveAttribute("href", "/jobs");
  });

  it("shows an error message when a request fails", async () => {
    vi.mocked(getApplicationSummary).mockRejectedValue(new Error("Unable to connect to the server."));
    vi.mocked(getMyApplications).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("Unable to connect to the server.")).toBeInTheDocument();
  });

  it("sends recruiters to the recruiter dashboard", () => {
    loginAs("RECRUITER");

    renderPage();

    expect(screen.getByRole("link", { name: "Recruiter Dashboard" })).toHaveAttribute("href", "/recruiter");
    expect(getApplicationSummary).not.toHaveBeenCalled();
  });
});
