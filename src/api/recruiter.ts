
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
  status: "open";
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
