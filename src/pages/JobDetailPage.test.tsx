
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
  render,
  screen,
} from "@testing-library/react";

import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";

import JobDetailPage from "./JobDetailPage";
import { getJob } from "../api/jobs";
import type { JobDetail } from "../types/job";

vi.mock("../api/jobs", () => ({
  getJob: vi.fn(),
}));

// Replace the Apply Dialog with a simple test button.
vi.mock("../components/ApplyDialog", () => ({
  default: () => (
    <button type="button">Apply now</button>
  ),
}));

const mockGetJob = vi.mocked(getJob);

const sampleJob: JobDetail = {
  id: 34,
  title: "Software Developer",
  company: "CareerNet Test",
  location: "Montreal",
  category: "Software Development",
  description: "Develop web applications.",
  status: "open",
  posted_at: "2026-11-07T18:58:43Z",
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/jobs/34"]}>
      <Routes>
        <Route
          path="/jobs/:id"
          element={<JobDetailPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("Job Detail Page - KR-7", () => {
  it("hides Apply for an archived job", async () => {
    mockGetJob.mockResolvedValue({
      ...sampleJob,
      status: "archived",
    });

    renderPage();

    expect(
      await screen.findByText("This job is closed.")
    ).toBeTruthy();

    expect(
      screen.queryByText("Apply for this job")
    ).toBeNull();

    expect(
      screen.queryByRole("button", { name: "Apply now" })
    ).toBeNull();

    expect(mockGetJob).toHaveBeenCalledWith(34);
  });

  it("allows applications for an open job", async () => {
    mockGetJob.mockResolvedValue({
      ...sampleJob,
      status: "open",
    });

    renderPage();

    expect(
      await screen.findByText("Apply for this job")
    ).toBeTruthy();

    expect(
      screen.getByRole("button", { name: "Apply now" })
    ).toBeTruthy();

    expect(
      screen.queryByText("This job is closed.")
    ).toBeNull();
  });
});
