import { apiFetch } from "./client";
import type { ApplicationActivity, ApplicationSummary } from "../types/analytics";

// how many of my applications are in each status
export async function getApplicationSummary(): Promise<ApplicationSummary> {
  return apiFetch<ApplicationSummary>("/applications/me/summary");
}

// how many applications I sent per day over the last `days` days
export async function getApplicationActivity(days = 30): Promise<ApplicationActivity> {
  return apiFetch<ApplicationActivity>(`/applications/me/activity?days=${days}`);
}
