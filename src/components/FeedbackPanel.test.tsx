import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import FeedbackPanel from "./FeedbackPanel";
import type { ResumeFeedback } from "../types/feedback";

afterEach(cleanup);

const FULL: ResumeFeedback = {
  summary: "Solid junior developer resume.",
  strengths: ["Clear project section", "Relevant internship"],
  improvements: [{ title: "Add numbers", suggestion: "Say how many users your app had." }],
  missing_sections: ["Certifications"],
  keywords: ["React", "FastAPI"],
  mode: "ai",
};

describe("FeedbackPanel", () => {
  it("shows the loading text", () => {
    render(<FeedbackPanel feedback={null} loading={true} error={null} />);
    expect(screen.getByText("Analyzing your resume. This can take up to 20 seconds.")).toBeInTheDocument();
  });

  it("shows the error message", () => {
    render(<FeedbackPanel feedback={null} loading={false} error="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("shows every section for a full answer", () => {
    render(<FeedbackPanel feedback={FULL} loading={false} error={null} />);

    for (const heading of ["Summary", "Strengths", "What to improve", "Missing sections", "Keywords"]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
    expect(screen.getByText("Solid junior developer resume.")).toBeInTheDocument();
    expect(screen.getByText("Relevant internship")).toBeInTheDocument();
    expect(screen.getByText("Add numbers")).toBeInTheDocument();
    expect(screen.getByText("Say how many users your app had.")).toBeInTheDocument();
    expect(screen.getByText("Certifications")).toBeInTheDocument();
    expect(screen.getByText("FastAPI")).toBeInTheDocument();
  });

  it("shows the sample banner only in fake mode", () => {
    const banner = /This is sample feedback/;

    const { rerender } = render(<FeedbackPanel feedback={FULL} loading={false} error={null} />);
    expect(screen.queryByText(banner)).not.toBeInTheDocument();

    rerender(<FeedbackPanel feedback={{ ...FULL, mode: "fake" }} loading={false} error={null} />);
    expect(screen.getByText(banner)).toBeInTheDocument();
  });

  it("shows None found when nothing is missing", () => {
    render(<FeedbackPanel feedback={{ ...FULL, missing_sections: [] }} loading={false} error={null} />);
    expect(screen.getByText("None found")).toBeInTheDocument();
  });

  it("renders nothing when all props are empty", () => {
    const { container } = render(<FeedbackPanel feedback={null} loading={false} error={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
