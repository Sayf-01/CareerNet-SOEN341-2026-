
import { describe, expect, it } from "vitest";
import { validatePosting } from "./postingValidation";
import type { CreateJobData } from "../api/recruiter";

const validPosting: CreateJobData = {
  title: "Junior Software Developer",
  company: "CareerNet Demo Company",
  location: "Montreal",
  category: "Software Development",
  description: "Develop and maintain web applications.",
};

describe("PostingForm validation - KR-6", () => {
  it("requires all five posting fields", () => {
    const errors = validatePosting({
      title: "",
      company: "",
      location: "",
      category: "",
      description: "",
    });

    expect(errors.title).toBe("Job title is required.");
    expect(errors.company).toBe("Company name is required.");
    expect(errors.location).toBe("Location is required.");
    expect(errors.category).toBe("Please select a category.");
    expect(errors.description).toBe(
      "Job description is required."
    );
  });

  it("rejects fields containing only spaces", () => {
    const errors = validatePosting({
      ...validPosting,
      title: "   ",
      company: "  ",
      description: "   ",
    });

    expect(errors.title).toBeDefined();
    expect(errors.company).toBeDefined();
    expect(errors.description).toBeDefined();
  });

  it("rejects an invalid job category", () => {
    const errors = validatePosting({
      ...validPosting,
      category: "Unknown Category",
    });

    expect(errors.category).toBe("Invalid job category.");
  });

  it("accepts a valid job posting", () => {
    const errors = validatePosting(validPosting);

    expect(errors).toEqual({});
  });
});
