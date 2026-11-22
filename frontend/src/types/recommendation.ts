// Shape of the job recommendations (Team Guide section 4, App/schemas/job_recommendation.py)

// One recommended job with its match score.
export interface JobRecommendation {
  job_id: number;
  title: string;
  company: string;
  location: string;
  category: string;
  score: number; // 0 to 100
  reasons: string[]; // 1 to 3 short sentences
}

// "ai" = the real model answered, "fake" = no AI key (test data),
// "fallback" = the AI failed so the backend used keyword matching
export type RecommendationMode = "ai" | "fake" | "fallback";

// What GET /api/v1/jobs/recommendations sends back.
export interface RecommendationList {
  items: JobRecommendation[]; // up to 5, best score first
  mode: RecommendationMode;
  resume_used: boolean; // true when the latest resume was used for matching
  message: string | null; // a notice to show, e.g. when there are no items
}
