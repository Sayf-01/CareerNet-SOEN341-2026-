import { apiFetch } from "./client";
import type { RecommendationList } from "../types/recommendation";

// Get up to 5 recommended jobs for the logged-in job seeker (LA-12).
// Each call counts against the 5-per-hour AI limit, so only call this
// when the panel opens or the user clicks Refresh.
// Errors: 403 recruiter, 409 empty profile, 429 limit reached.
export async function getRecommendations(): Promise<RecommendationList> {
  return apiFetch<RecommendationList>("/jobs/recommendations");
}
