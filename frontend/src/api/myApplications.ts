
import { apiFetch } from "./client";
import type { MyApplication } from "../types/application";

/**
 * Get applications belonging to the logged-in user.
 *
 * Uses the real FastAPI backend instead of mock data.
 */
export async function getMyApplications(): Promise<MyApplication[]> {
  return apiFetch<MyApplication[]>("/applications/me");
}
