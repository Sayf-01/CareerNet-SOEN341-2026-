
import type { CreateJobData } from "../api/recruiter";
import { JOB_CATEGORIES } from "../constants/jobFilters";

export type PostingFormErrors = Partial<
  Record<keyof CreateJobData, string>
>;

export function validatePosting(
  form: CreateJobData
): PostingFormErrors {
  const errors: PostingFormErrors = {};

  if (!form.title.trim()) {
    errors.title = "Job title is required.";
  }

  if (!form.company.trim()) {
    errors.company = "Company name is required.";
  }

  if (!form.location.trim()) {
    errors.location = "Location is required.";
  }

  if (!form.category) {
    errors.category = "Please select a category.";
  } else if (
    !JOB_CATEGORIES.some(
      (category) => category === form.category
    )
  ) {
    errors.category = "Invalid job category.";
  }

  if (!form.description.trim()) {
    errors.description = "Job description is required.";
  }

  return errors;
}