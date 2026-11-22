
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "./client";

import {
  getResumes,
  uploadResume,
  replaceResume,
  deleteResume,
  downloadResume,
  getResumeFeedback,
} from "./resumes";

import { RESUME_VALIDATION_ERROR } from "../constants/resumeRules";

vi.mock("./client", () => ({
  apiFetch: vi.fn(),
}));

afterEach(() => {
  vi.resetAllMocks();
});

function makePdf(name = "resume.pdf") {
  return new File(["sample resume"], name, {
    type: "application/pdf",
  });
}

function expectResumeRequest(
  url: string,
  method: string,
  file: File
) {
  expect(apiFetch).toHaveBeenCalledOnce();

  const [actualUrl, options] = vi.mocked(apiFetch).mock.calls[0];

  expect(actualUrl).toBe(url);
  expect(options?.method).toBe(method);
  expect(options?.body).toBeInstanceOf(FormData);

  const formData = options?.body as FormData;
  expect(formData.get("file")).toBe(file);
}


describe("KR-12 Resume API Tests", () => {
  it("requests the logged-in user's resumes", async () => {
    const resumes = [
      { id: 1, filename: "resume.pdf" },
    ];

    vi.mocked(apiFetch).mockResolvedValue(resumes);

    const result = await getResumes();

    expect(apiFetch).toHaveBeenCalledWith("/resumes");
    expect(result).toEqual(resumes);
  });


it("uploads a valid resume using FormData", async () => {
  const file = makePdf();

  vi.mocked(apiFetch).mockResolvedValue({
    id: 10,
    filename: "resume.pdf",
  });

  await uploadResume(file);

  expectResumeRequest("/resumes", "POST", file);
});




  it("rejects an invalid resume before uploading", async () => {
    const file = new File(["invalid"], "notes.txt", {
      type: "text/plain",
    });

    await expect(uploadResume(file)).rejects.toThrow(
      RESUME_VALIDATION_ERROR
    );

    expect(apiFetch).not.toHaveBeenCalled();
  });


it("replaces a resume using PUT and the correct ID", async () => {
  const file = makePdf("updated.pdf");

  vi.mocked(apiFetch).mockResolvedValue({
    id: 15,
    filename: "updated.pdf",
  });

  await replaceResume(15, file);

  expectResumeRequest("/resumes/15", "PUT", file);
});




  it("rejects invalid replacement files", async () => {
    const file = new File(["invalid"], "resume.exe", {
      type: "application/octet-stream",
    });

    await expect(replaceResume(15, file)).rejects.toThrow(
      RESUME_VALIDATION_ERROR
    );

    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("deletes the correct resume", async () => {
    vi.mocked(apiFetch).mockResolvedValue(undefined);

    await deleteResume(20);

    expect(apiFetch).toHaveBeenCalledWith(
      "/resumes/20",
      { method: "DELETE" }
    );
  });

  it("downloads the correct resume", async () => {
    const fileBlob = new Blob(["PDF content"], {
      type: "application/pdf",
    });

    vi.mocked(apiFetch).mockResolvedValue(fileBlob);

    const result = await downloadResume(30);

    expect(apiFetch).toHaveBeenCalledWith(
      "/resumes/30/download"
    );

    expect(result).toBe(fileBlob);
  });

  it("requests AI feedback using POST", async () => {
    const feedback = {
      summary: "Good experience",
      strengths: ["Python"],
      improvements: [],
      missing_sections: [],
      keywords: ["React"],
    };

    vi.mocked(apiFetch).mockResolvedValue(feedback);

    const result = await getResumeFeedback(40);

    expect(apiFetch).toHaveBeenCalledWith(
      "/resumes/40/feedback",
      { method: "POST" }
    );

    expect(result).toEqual(feedback);
  });

  it("propagates backend errors", async () => {
    vi.mocked(apiFetch).mockRejectedValue(
      new Error("Server unavailable")
    );

    await expect(getResumes()).rejects.toThrow(
      "Server unavailable"
    );
  });
});
