
import { apiFetch, ApiError } from "./client";
import type { Profile } from "../types/profile";

/**
 * Get the logged-in user's profile from PostgreSQL.
 * Return null if the user hasn't created a profile.
 */
export async function getProfile(): Promise<Profile | null> {
  try {
    return await apiFetch<Profile>("/profile/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

/**
 * Create or update the logged-in user's profile.
 * The backend saves it to PostgreSQL.
 */
export async function saveProfile(
  data: Profile
): Promise<Profile> {
  return apiFetch<Profile>("/profile/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
