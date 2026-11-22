
import { apiFetch, ApiError } from "./client";

// Response returned after submitting an application.
export interface ApplicationResponse {
  id: number;
  status: string;
  applied_at: string;
  message: string;
}

// Keep compatibility with the existing ApplyDialog.
export class ApplicationError extends ApiError {
  constructor(message: string, status: number) {
    super(message, status);
    this.name = "ApplicationError";
  }
}

/**
 * Submit a real application to FastAPI.
 * The backend saves it in PostgreSQL.
 */
export async function applyToJob(
  jobId: number,
  resumeId: number,
  coverNote: string = ""
): Promise<ApplicationResponse> {
  if (!Number.isSafeInteger(jobId) || jobId <= 0) {
    throw new ApplicationError("Invalid job.", 400);
  }

  if (!Number.isSafeInteger(resumeId) || resumeId <= 0) {
    throw new ApplicationError("Please select a valid resume.", 400);
  }

  if (coverNote.length > 1000) {
    throw new ApplicationError(
      "Cover note cannot exceed 1000 characters.",
      400
    );
  }

  try {
    return await apiFetch<ApplicationResponse>("/applications", {
      method: "POST",
      body: JSON.stringify({
        job_id: jobId,
        resume_id: resumeId,
        cover_note: coverNote,
      }),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      throw new ApplicationError(
        "You have already applied to this job.",
        409
      );
    }

    throw error;
  }
}
