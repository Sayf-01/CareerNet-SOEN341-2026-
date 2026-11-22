
// Represents one job in the job listing page.
export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  category: string;
  posted_at: string;
}

// Represents the complete information for one job.
export interface JobDetail extends Job {
  description: string;
  status: "open" | "closed" | "archived";
}
// Represents the response returned by the job listing API.
export interface JobListResponse {
  items: Job[];
  total: number;
}

// Parameters accepted by the searchJobs function.
// These will also be used in DA-2 for filtering.
export interface JobSearchParams {
  keyword?: string;
  location?: string;
  category?: string;
  page?: number;
}
