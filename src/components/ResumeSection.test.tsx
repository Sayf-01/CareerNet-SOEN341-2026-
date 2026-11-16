
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import ResumeSection from "./ResumeSection";
import { getResumes, getResumeFeedback } from "../api/resumes";
import { ApiError } from "../api/client";
import type { Resume } from "../types/resume";
import type { ResumeFeedback } from "../types/feedback";

// Mock API functions so these tests do not need a real backend.
vi.mock("../api/resumes", () => ({
  getResumes: vi.fn(),
  uploadResume: vi.fn(),
  replaceResume: vi.fn(),
  deleteResume: vi.fn(),
  downloadResume: vi.fn(),
  getResumeFeedback: vi.fn(),
}));

const testResumes: Resume[] = [
  {
    id: 11,
    filename: "Software_Resume.pdf",
    content_type: "application/pdf",
    size_bytes: 2048,
    uploaded_at: "2026-11-10T14:00:00Z",
  },
  {
    id: 22,
    filename: "Updated_Resume.pdf",
    content_type: "application/pdf",
    size_bytes: 4096,
    uploaded_at: "2026-11-12T14:00:00Z",
  },
];

const sampleFeedback: ResumeFeedback = {
  summary: "Your resume has a clear structure.",
  strengths: ["Good technical skills"],
  improvements: [
    {
      title: "Project experience",
      suggestion: "Include more project details.",
    },
  ],
  missing_sections: ["Certifications"],
  keywords: ["React", "TypeScript"],
  mode: "fake",
};

beforeEach(() => {
  vi.mocked(getResumes).mockResolvedValue(testResumes);
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe("KR-11 AI Resume Feedback", () => {
  it("asks for confirmation before requesting feedback", async () => {
    render(<ResumeSection />);

    const buttons = await screen.findAllByRole("button", {
      name: "Get AI feedback",
    });

    fireEvent.click(buttons[0]);

    expect(window.confirm).toHaveBeenCalledWith(
      "Your resume text will be sent to an AI service to create feedback. Do not continue if your resume contains information you do not want to share. Continue?"
    );
  });

  it("does not call the API when confirmation is cancelled", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);

    render(<ResumeSection />);

    const buttons = await screen.findAllByRole("button", {
      name: "Get AI feedback",
    });

    fireEvent.click(buttons[0]);

    expect(getResumeFeedback).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("region", { name: "Resume feedback" })
    ).not.toBeInTheDocument();
  });

  it("requests feedback for the selected resume and displays it", async () => {
    vi.mocked(getResumeFeedback).mockResolvedValue(sampleFeedback);

    render(<ResumeSection />);

    const buttons = await screen.findAllByRole("button", {
      name: "Get AI feedback",
    });

    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(getResumeFeedback).toHaveBeenCalledWith(11);
    });

    expect(
      await screen.findByText("Your resume has a clear structure.")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Good technical skills")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Include more project details.")
    ).toBeInTheDocument();

    expect(
      screen.getByText(/This is sample feedback/)
    ).toBeInTheDocument();
  });

  it("shows feedback for only one resume at a time", async () => {
    vi.mocked(getResumeFeedback)
      .mockResolvedValueOnce({
        ...sampleFeedback,
        summary: "Feedback for resume one",
      })
      .mockResolvedValueOnce({
        ...sampleFeedback,
        summary: "Feedback for resume two",
      });

    render(<ResumeSection />);

    const buttons = await screen.findAllByRole("button", {
      name: "Get AI feedback",
    });

    fireEvent.click(buttons[0]);

    expect(
      await screen.findByText("Feedback for resume one")
    ).toBeInTheDocument();

    fireEvent.click(buttons[1]);

    expect(
      await screen.findByText("Feedback for resume two")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Feedback for resume one")
    ).not.toBeInTheDocument();

    expect(getResumeFeedback).toHaveBeenCalledWith(22);
  });

  it.each([
    [422, "We could not read text from this file."],
    [503, "AI feedback is temporarily unavailable."],
  ])(
    "displays the backend error for status %i",
    async (status, message) => {
      vi.mocked(getResumeFeedback).mockRejectedValue(
        new ApiError(message, status)
      );

      render(<ResumeSection />);

      const buttons = await screen.findAllByRole("button", {
        name: "Get AI feedback",
      });

      fireEvent.click(buttons[0]);

      expect(
        await screen.findByText(message)
      ).toBeInTheDocument();
    }
  );

  it("disables resume buttons while feedback is loading", async () => {
    let resolveFeedback:
      | ((value: ResumeFeedback) => void)
      | undefined;

    vi.mocked(getResumeFeedback).mockImplementation(
      () =>
        new Promise<ResumeFeedback>((resolve) => {
          resolveFeedback = resolve;
        })
    );

    render(<ResumeSection />);

    const buttons = await screen.findAllByRole("button", {
      name: "Get AI feedback",
    });

    fireEvent.click(buttons[0]);

    expect(
      await screen.findByText(/Analyzing your resume/)
    ).toBeInTheDocument();

    expect(buttons[0]).toBeDisabled();
    expect(
      screen.getAllByRole("button", { name: "Download" })[0]
    ).toBeDisabled();

    expect(
      screen.getAllByRole("button", { name: "Replace" })[0]
    ).toBeDisabled();

    expect(
      screen.getAllByRole("button", { name: "Delete" })[0]
    ).toBeDisabled();

    await act(async () => {
      resolveFeedback?.(sampleFeedback);
    });

    await waitFor(() => {
      expect(buttons[0]).toBeEnabled();
    });
  });
});
