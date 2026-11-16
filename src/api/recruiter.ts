
import { apiFetch } from "./client";
import type { ApplicationStatus } from "../types/application";


// Information entered in the job posting form.
export interface CreateJobData {
  title: string;
  company: string;
  location: string;
  category: string;
  description: string;
}

// Job returned by the backend.
export interface RecruiterJob extends CreateJobData {
  id: number;
  status: "open" | "archived";
  posted_at: string;
}

// Application received for a recruiter's job.
export interface RecruiterApplication {
  application_id: number;
  applicant_name: string;
  resume_id: number | null;
  status:
    | "Applied"
    | "Under Review"
    | "Interview"
    | "Offered"
    | "Rejected";
  applied_at: string;
  interview_at?: string | null;
}

// Optional filters for the applicant list (DA-9). Empty = no filter.
export interface ApplicantFilters {
  status?: string;
  dateFrom?: string; // "YYYY-MM-DD"
  dateTo?: string; // "YYYY-MM-DD"
}

// Create a real job posting in PostgreSQL.
export async function createJob(
  data: CreateJobData
): Promise<RecruiterJob> {
  return apiFetch<RecruiterJob>("/recruiter/jobs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Retrieve applications for a recruiter's job.
export async function getApplicationsForJob(
  jobId: number,
  filters: ApplicantFilters = {}
): Promise<RecruiterApplication[]> {
  // only send the filters that are actually set
  const query = new URLSearchParams();
  if (filters.status) query.set("status", filters.status);
  if (filters.dateFrom) query.set("date_from", filters.dateFrom);
  if (filters.dateTo) query.set("date_to", filters.dateTo);

  const qs = query.toString();
  return apiFetch<RecruiterApplication[]>(
    `/recruiter/jobs/${jobId}/applications${qs ? `?${qs}` : ""}`
  );
}



/**
 * One posting in the recruiter's job list.
 */
export interface RecruiterPosting {
  id: number;
  title: string;
  company: string;
  location: string;
  category: string;
  status: "open" | "archived";
  posted_at: string;
  application_count: number;
}

/**
 * Get all postings belonging to the logged-in recruiter.
 */
export async function getMyJobs(): Promise<RecruiterPosting[]> {
  return apiFetch<RecruiterPosting[]>("/recruiter/jobs");
}


/**
 * Update only the changed fields of a recruiter's posting.
 */
export async function updateJob(
  jobId: number,
  fields: Partial<CreateJobData>
): Promise<RecruiterJob> {
  return apiFetch<RecruiterJob>(
    `/recruiter/jobs/${jobId}`,
    {
      method: "PATCH",
      body: JSON.stringify(fields),
    }
  );
}

/**
 * Archive a recruiter's job posting.
 */
export async function archiveJob(
  jobId: number
): Promise<RecruiterJob> {
  return apiFetch<RecruiterJob>(
    `/recruiter/jobs/${jobId}/archive`,
    {
      method: "POST",
    }
  );
}

/**
 * Restore an archived posting to open status.
 */
export async function unarchiveJob(
  jobId: number
): Promise<RecruiterJob> {
  return apiFetch<RecruiterJob>(
    `/recruiter/jobs/${jobId}/unarchive`,
    {
      method: "POST",
    }
  );
}

// Response returned after updating an application's status.
export interface ApplicationStatusUpdate {
  id: number;
  status: ApplicationStatus;
  interview_at: string | null;
  updated_at: string;
}

/**
 * Update an applicant's status and optionally schedule an interview.
 * The interview date must be an ISO date-time string.
 */
export async function updateApplicationStatus(
  applicationId: number,
  status: ApplicationStatus,
  interviewAt?: string
): Promise<ApplicationStatusUpdate> {
  return apiFetch<ApplicationStatusUpdate>(
    `/applications/${applicationId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
        ...(interviewAt ? { interview_at: interviewAt } : {}),
      }),
    }
  );
}


/**
 * Download the resume attached to a recruiter's application.
 * The shared API helper includes the logged-in user's token.
 */
export async function downloadApplicantResume(
  applicationId: number
): Promise<Blob> {
  return apiFetch<Blob>(
    `/applications/${applicationId}/resume`
  );
}
