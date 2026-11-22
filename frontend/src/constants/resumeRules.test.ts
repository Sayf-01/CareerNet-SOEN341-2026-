
import { describe, expect, it } from "vitest";

import {
  validateResumeFile,
  MAX_RESUME_SIZE,
  RESUME_VALIDATION_ERROR,
  RESUME_ACCEPT,
} from "./resumeRules";

describe("KR-12 Resume File Validation", () => {
  // Creates a test file without allocating several MB of memory.
  function makeFile(
    name: string,
    type: string,
    size: number
  ): File {
    const file = new File(["test"], name, { type });

    Object.defineProperty(file, "size", {
      configurable: true,
      value: size,
    });

    return file;
  }

  it("accepts a valid PDF resume", () => {
    const file = makeFile(
      "resume.pdf",
      "application/pdf",
      1024
    );

    expect(validateResumeFile(file)).toBeNull();
  });

  it("accepts DOC and DOCX resumes", () => {
    const doc = makeFile(
      "resume.doc",
      "application/msword",
      1024
    );

    const docx = makeFile(
      "resume.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      1024
    );

    expect(validateResumeFile(doc)).toBeNull();
    expect(validateResumeFile(docx)).toBeNull();
  });

  it("accepts uppercase file extensions", () => {
    const file = makeFile(
      "Resume.PDF",
      "application/pdf",
      1024
    );

    expect(validateResumeFile(file)).toBeNull();
  });

  it("rejects unsupported file extensions", () => {
    const file = makeFile(
      "resume.txt",
      "text/plain",
      1024
    );

    expect(validateResumeFile(file)).toBe(
      RESUME_VALIDATION_ERROR
    );
  });

  it("rejects files without an extension", () => {
    const file = makeFile(
      "resume",
      "",
      1024
    );

    expect(validateResumeFile(file)).toBe(
      RESUME_VALIDATION_ERROR
    );
  });

  it("rejects an incorrect MIME type", () => {
    const file = makeFile(
      "resume.pdf",
      "text/plain",
      1024
    );

    expect(validateResumeFile(file)).toBe(
      RESUME_VALIDATION_ERROR
    );
  });

  it("accepts a Word file with an empty MIME type", () => {
    const file = makeFile(
      "resume.docx",
      "",
      1024
    );

    expect(validateResumeFile(file)).toBeNull();
  });

  it("rejects files larger than 5 MB", () => {
    const file = makeFile(
      "resume.pdf",
      "application/pdf",
      MAX_RESUME_SIZE + 1
    );

    expect(validateResumeFile(file)).toBe(
      RESUME_VALIDATION_ERROR
    );
  });

  it("accepts a file exactly 5 MB", () => {
    const file = makeFile(
      "resume.pdf",
      "application/pdf",
      MAX_RESUME_SIZE
    );

    expect(validateResumeFile(file)).toBeNull();
  });

  it("rejects an empty file", () => {
    const file = makeFile(
      "resume.pdf",
      "application/pdf",
      0
    );

    expect(validateResumeFile(file)).toBe(
      RESUME_VALIDATION_ERROR
    );
  });

  it("provides the correct file input extensions", () => {
    expect(RESUME_ACCEPT).toBe(
      ".pdf,.doc,.docx"
    );
  });
});
