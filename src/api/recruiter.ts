
import { apiFetch } from "./client";



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
  jobId: number
): Promise<RecruiterApplication[]> {
  return apiFetch<RecruiterApplication[]>(
    `/recruiter/jobs/${jobId}/applications`
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
