import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import ApplicantsPanel from "./ApplicantsPanel";
import { getApplicationsForJob, type RecruiterApplication } from "../api/recruiter";

// fake the API so no backend is needed
vi.mock("../api/recruiter");

const ALICE: RecruiterApplication = {
  application_id: 1,
  applicant_name: "Alice Martin",
  resume_id: 3,
  status: "Interview",
  applied_at: "2026-11-10T14:00:00Z",
  interview_at: "2026-11-20T15:00:00Z",
};

beforeEach(() => {
  vi.mocked(getApplicationsForJob).mockResolvedValue([ALICE]);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("ApplicantsPanel", () => {
  it("loads all applicants first, with no filters", async () => {
    render(<ApplicantsPanel jobId={7} />);

    expect(await screen.findByText("Alice Martin")).toBeInTheDocument();
    expect(screen.getByText("Showing 1 application")).toBeInTheDocument();
    expect(getApplicationsForJob).toHaveBeenCalledWith(7, { status: "", dateFrom: "", dateTo: "" });
  });

  it("calls the API again with the chosen status", async () => {
    render(<ApplicantsPanel jobId={7} />);
    await screen.findByText("Alice Martin");

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "Interview" } });

    await screen.findByText("Alice Martin");
    expect(getApplicationsForJob).toHaveBeenLastCalledWith(7, { status: "Interview", dateFrom: "", dateTo: "" });
  });

  it("sends the date range when dates are picked", async () => {
    render(<ApplicantsPanel jobId={7} />);
    await screen.findByText("Alice Martin");

    fireEvent.change(screen.getByLabelText("Applied from"), { target: { value: "2026-11-01" } });
    fireEvent.change(screen.getByLabelText("Applied to"), { target: { value: "2026-11-30" } });

    await screen.findByText("Alice Martin");
    expect(getApplicationsForJob).toHaveBeenLastCalledWith(7, {
      status: "", dateFrom: "2026-11-01", dateTo: "2026-11-30",
    });
  });

  it("Clear filters resets everything", async () => {
    render(<ApplicantsPanel jobId={7} />);
    await screen.findByText("Alice Martin");

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "Rejected" } });
    await screen.findByText("Alice Martin");
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    await screen.findByText("Alice Martin");
    expect(screen.getByLabelText("Status")).toHaveValue("");
    expect(getApplicationsForJob).toHaveBeenLastCalledWith(7, { status: "", dateFrom: "", dateTo: "" });
  });

  it("shows a message when nothing matches", async () => {
    vi.mocked(getApplicationsForJob).mockResolvedValue([]);
    render(<ApplicantsPanel jobId={7} />);

    expect(await screen.findByText("No applications match")).toBeInTheDocument();
  });

  it("shows the error message when the request fails", async () => {
    vi.mocked(getApplicationsForJob).mockRejectedValue(new Error("Job not found"));
    render(<ApplicantsPanel jobId={7} />);

    expect(await screen.findByText("Job not found")).toBeInTheDocument();
  });
});
