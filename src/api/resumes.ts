
import { apiFetch } from "./client";
import type { Resume } from "../types/resume";
import { validateResumeFile } from "../constants/resumeRules";

// Get resumes belonging to the logged-in user.
export async function getResumes(): Promise<Resume[]> {
  return apiFetch<Resume[]>("/resumes");
}

// Upload a new resume to the backend.
export async function uploadResume(
  file: File
): Promise<Resume> {
  const error = validateResumeFile(file);

  if (error) {
    throw new Error(error);
  }

  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<Resume>("/resumes", {
    method: "POST",
    body: formData,
  });
}

// Replace an existing resume.
export async function replaceResume(
  id: number,
  file: File
): Promise<Resume> {
  const error = validateResumeFile(file);

  if (error) {
    throw new Error(error);
  }

  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<Resume>(`/resumes/${id}`, {
    method: "PUT",
    body: formData,
  });
}

// Delete a resume from PostgreSQL.
export async function deleteResume(
  id: number
): Promise<void> {
  await apiFetch<void>(`/resumes/${id}`, {
    method: "DELETE",
  });
}

// Download an uploaded resume.
export async function downloadResume(
  id: number
): Promise<Blob> {
  return apiFetch<Blob>(`/resumes/${id}/download`);
}
