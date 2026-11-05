
import { apiFetch, ApiError } from "./client";

import type {
  JobDetail,
  JobListResponse,
  JobSearchParams,
} from "../types/job";

// Number of jobs displayed per page.
export const JOBS_PER_PAGE = 10;

// Get real jobs from the FastAPI backend.
export async function searchJobs(
  params: JobSearchParams = {}
): Promise<JobListResponse> {
  const query = new URLSearchParams();

  const page =
    params.page !== undefined &&
    Number.isSafeInteger(params.page) &&
    params.page > 0
      ? params.page
      : 1;

  query.set("page", String(page));

  if (params.keyword?.trim()) {
    query.set("keyword", params.keyword.trim());
  }

  if (params.location?.trim()) {
    query.set("location", params.location.trim());
  }

  if (params.category?.trim()) {
    query.set("category", params.category.trim());
  }

  return apiFetch<JobListResponse>(
    `/jobs?${query.toString()}`
  );
}

// Get details of a specific job from FastAPI.
export async function getJob(
  id: number
): Promise<JobDetail | null> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  try {
    return await apiFetch<JobDetail>(`/jobs/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}
