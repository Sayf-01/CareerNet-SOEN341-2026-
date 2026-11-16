
// @vitest-environment jsdom

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";

import RecruiterDashboardPage from "./RecruiterDashboardPage";
import * as recruiterApi from "../api/recruiter";

vi.mock("../api/recruiter", () => ({
  getMyJobs: vi.fn(),
  createJob: vi.fn(),
}));

const mockGetMyJobs = vi.mocked(recruiterApi.getMyJobs);
const mockCreateJob = vi.mocked(recruiterApi.createJob);

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("Recruiter Dashboard - KR-6", () => {
  it("refreshes the postings list after creating a job", async () => {
    const newJob = {
      title: "Sprint 3 Test Developer",
      company: "CareerNet Test",
      location: "Montreal",
      category: "Software Development",
      description: "Test job posting.",
    };

    const createdJob = {
      ...newJob,
      id: 34,
      status: "open" as const,
      posted_at: "2026-11-07T18:58:43Z",
    };

    const posting = {
      ...createdJob,
      application_count: 0,
    };

    // First load: no postings.
    // Second load: newly created posting appears.
    mockGetMyJobs
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([posting]);

    mockCreateJob.mockResolvedValue(createdJob);

    render(
      <MemoryRouter>
        <RecruiterDashboardPage />
      </MemoryRouter>
    );

    // Initial empty state.
    expect(
      await screen.findByText("No postings yet.")
    ).toBeTruthy();

    // Fill out the posting form.
    fireEvent.change(
      screen.getByLabelText("Job Title *"),
      { target: { value: newJob.title } }
    );

    fireEvent.change(
      screen.getByLabelText("Company *"),
      { target: { value: newJob.company } }
    );

    fireEvent.change(
      screen.getByLabelText("Location *"),
      { target: { value: newJob.location } }
    );

    fireEvent.change(
      screen.getByLabelText("Job Category *"),
      { target: { value: newJob.category } }
    );

    fireEvent.change(
      screen.getByLabelText("Job Description *"),
      { target: { value: newJob.description } }
    );

    // Submit the new job.
    fireEvent.click(
      screen.getByRole("button", { name: "Post Job" })
    );

    // Confirm the API received the correct data.
    await waitFor(() => {
      expect(mockCreateJob).toHaveBeenCalledWith(
        newJob
      );
    });

    // The dashboard must fetch postings again.
    await waitFor(() => {
      expect(mockGetMyJobs).toHaveBeenCalledTimes(2);
    });

    // The new job must appear in the table.
    expect(
      await screen.findByText("Sprint 3 Test Developer")
    ).toBeTruthy();

    // The success message must also be visible.
    expect(
      screen.getByText(
        'Job "Sprint 3 Test Developer" posted successfully!'
      )
    ).toBeTruthy();
  });
});
