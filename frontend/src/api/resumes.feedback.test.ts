
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import * as client from "./client";
import { getResumeFeedback } from "./resumes";
import type { ResumeFeedback } from "../types/feedback";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("KR-11 AI Resume Feedback API", () => {
  it("sends a POST request for the selected resume", async () => {
    const mockFeedback: ResumeFeedback = {
      summary: "Your resume is well organized.",
      strengths: ["Clear technical skills"],
      improvements: [
        {
          title: "Work experience",
          suggestion: "Add more specific examples.",
        },
      ],
      missing_sections: [],
      keywords: ["React", "Python"],
      mode: "fake",
    };

    const apiSpy = vi
      .spyOn(client, "apiFetch")
      .mockResolvedValue(mockFeedback);

    const result = await getResumeFeedback(11);

    expect(apiSpy).toHaveBeenCalledWith(
      "/resumes/11/feedback",
      {
        method: "POST",
      }
    );

    expect(result).toEqual(mockFeedback);
    expect(result.summary).toBe(
      "Your resume is well organized."
    );
  });

  it("propagates a 422 error when resume text cannot be read", async () => {
    vi.spyOn(client, "apiFetch").mockRejectedValue(
      new client.ApiError(
        "We could not read text from this file.",
        422
      )
    );

    await expect(
      getResumeFeedback(11)
    ).rejects.toMatchObject({
      status: 422,
      message: "We could not read text from this file.",
    });
  });

  it("propagates a 503 error when AI feedback is unavailable", async () => {
    vi.spyOn(client, "apiFetch").mockRejectedValue(
      new client.ApiError(
        "AI feedback is temporarily unavailable.",
        503
      )
    );

    await expect(
      getResumeFeedback(11)
    ).rejects.toMatchObject({
      status: 503,
      message: "AI feedback is temporarily unavailable.",
    });
  });
});
