
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import ApplyDialog from "./ApplyDialog";
import { getResumes } from "../api/resumes";
import { applyToJob, ApplicationError } from "../api/applications";

vi.mock("../api/resumes", () => ({
  getResumes: vi.fn(),
}));

vi.mock("../api/applications", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/applications")>();

  return {
    ...actual,
    applyToJob: vi.fn(),
  };
});

const sampleResume = {
  id: 7,
  filename: "resume.pdf",
};

function renderDialog() {
  return render(
    <MemoryRouter>
      <ApplyDialog jobId={42} jobTitle="Software Developer" />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.resetAllMocks();

  // jsdom does not fully support native dialog methods.
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });

  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    },
  });

  vi.mocked(getResumes).mockResolvedValue([
    sampleResume,
  ] as Awaited<ReturnType<typeof getResumes>>);
});

afterEach(() => {
  cleanup();
});

describe("KR-12 Apply Dialog Tests", () => {
  it("opens the dialog and loads the user's resumes", async () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Software Developer")).toBeInTheDocument();

    expect(
      await screen.findByRole("option", { name: "resume.pdf" })
    ).toBeInTheDocument();

    expect(getResumes).toHaveBeenCalledTimes(1);
  });

  it("tells the user to upload a resume when none exists", async () => {
    vi.mocked(getResumes).mockResolvedValue([]);

    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(
      await screen.findByText(/upload a resume first before applying/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Go to My Profile" })
    ).toHaveAttribute("href", "/profile");

    expect(applyToJob).not.toHaveBeenCalled();
  });

  it("submits an application with the selected resume and cover note", async () => {
    vi.mocked(applyToJob).mockResolvedValue({
      id: 101,
      status: "Applied",
      applied_at: "2026-11-21T12:00:00Z",
      message: "Application submitted successfully!",
    });

    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await screen.findByRole("option", { name: "resume.pdf" });

    fireEvent.change(
      screen.getByRole("textbox", { name: /cover note/i }),
      { target: { value: "I am interested in this position." } }
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Submit Application" })
    );

    await waitFor(() => {
      expect(applyToJob).toHaveBeenCalledWith(
        42,
        7,
        "I am interested in this position."
      );
    });

    expect(
      await screen.findByText("Application submitted successfully!")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "See my applications" })
    ).toHaveAttribute("href", "/applications");
  });

  it("shows a clear error when the user already applied", async () => {
    vi.mocked(applyToJob).mockRejectedValue(
      new ApplicationError("Duplicate application", 409)
    );

    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await screen.findByRole("option", { name: "resume.pdf" });

    fireEvent.click(
      screen.getByRole("button", { name: "Submit Application" })
    );

    expect(
      await screen.findByText("You have already applied to this job.")
    ).toBeInTheDocument();
  });

  it("shows a backend error and allows the user to retry", async () => {
    vi.mocked(applyToJob)
      .mockRejectedValueOnce(new Error("Server unavailable"))
      .mockResolvedValueOnce({
        id: 102,
        status: "Applied",
        applied_at: "2026-11-21T12:00:00Z",
        message: "Application submitted successfully!",
      });

    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await screen.findByRole("option", { name: "resume.pdf" });

    fireEvent.click(
      screen.getByRole("button", { name: "Submit Application" })
    );

    expect(
      await screen.findByText("Server unavailable")
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Submit Application" })
    );

    expect(
      await screen.findByText("Application submitted successfully!")
    ).toBeInTheDocument();

    expect(applyToJob).toHaveBeenCalledTimes(2);
  });

  it("shows an error if resumes cannot be loaded", async () => {
    vi.mocked(getResumes).mockRejectedValue(
      new Error("Network error")
    );

    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(
      await screen.findByText("Unable to load your resumes.")
    ).toBeInTheDocument();

    expect(applyToJob).not.toHaveBeenCalled();
  });
});
