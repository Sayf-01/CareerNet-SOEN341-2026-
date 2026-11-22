
import { afterEach, describe, expect, it, vi } from "vitest";

import * as client from "./client";
import { searchJobs } from "./jobs";
import { getProfile, saveProfile } from "./profile";
import { getMyApplications } from "./myApplications";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CareerNet real API integration", () => {
  it("searches jobs using the correct API path", async () => {
    const jobs = {
      items: [
        {
          id: 19,
          title: "Junior Developer",
          company: "Demo Company",
          location: "Montreal",
          category: "Software Development",
          posted_at: "2026-11-05T10:00:00Z",
        },
      ],
      total: 1,
    };

    const apiSpy = vi
      .spyOn(client, "apiFetch")
      .mockResolvedValue(jobs);

    const result = await searchJobs({
      keyword: " developer ",
      page: 2,
    });

    expect(apiSpy).toHaveBeenCalledWith(
      "/jobs?page=2&keyword=developer"
    );
    expect(result).toEqual(jobs);
  });

  it("returns null when a profile does not exist", async () => {
    const apiSpy = vi
      .spyOn(client, "apiFetch")
      .mockRejectedValue(new client.ApiError("Not found", 404));

    const result = await getProfile();

    expect(apiSpy).toHaveBeenCalledWith("/profile/me");
    expect(result).toBeNull();
  });

  it("saves a profile using PUT and JSON data", async () => {
    const profile = {
      full_name: "Test Student",
      headline: "Software Developer",
      location: "Montreal",
      phone: "",
      summary: "Looking for internships",
      skills: ["React", "TypeScript"],
    };

    const apiSpy = vi
      .spyOn(client, "apiFetch")
      .mockResolvedValue(profile);

    const result = await saveProfile(profile);

    expect(apiSpy).toHaveBeenCalledWith("/profile/me", {
      method: "PUT",
      body: JSON.stringify(profile),
    });
    expect(result).toEqual(profile);
  });

  it("retrieves the current user's applications", async () => {
    const applications = [
      {
        id: 1,
        job_title: "Junior Developer",
        company: "Demo Company",
        status: "Applied",
        applied_at: "2026-11-05T10:00:00Z",
        updated_at: "2026-11-05T10:00:00Z",
      },
    ];

    const apiSpy = vi
      .spyOn(client, "apiFetch")
      .mockResolvedValue(applications);

    const result = await getMyApplications();

    expect(apiSpy).toHaveBeenCalledWith("/applications/me");
    expect(result).toEqual(applications);
  });
});
