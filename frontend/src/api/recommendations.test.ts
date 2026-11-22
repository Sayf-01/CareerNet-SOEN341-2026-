import { afterEach, describe, expect, it, vi } from "vitest";

import * as client from "./client";
import { getRecommendations } from "./recommendations";
import type { RecommendationList } from "../types/recommendation";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DA-11 recommendations API", () => {
  it("sends a GET request to /jobs/recommendations and returns the list", async () => {
    const answer: RecommendationList = {
      items: [
        {
          job_id: 3,
          title: "Data Analyst Intern",
          company: "Initech",
          location: "Laval",
          category: "Data",
          score: 72,
          reasons: ["You listed SQL."],
        },
      ],
      mode: "fake",
      resume_used: false,
      message: null,
    };
    const apiSpy = vi.spyOn(client, "apiFetch").mockResolvedValue(answer);

    const result = await getRecommendations();

    // a plain GET: no method or body passed
    expect(apiSpy).toHaveBeenCalledWith("/jobs/recommendations");
    expect(result).toEqual(answer);
  });

  it("passes the 429 error on to the panel", async () => {
    vi.spyOn(client, "apiFetch").mockRejectedValue(
      new client.ApiError("You have used your hourly AI limit. Please try again later.", 429),
    );

    await expect(getRecommendations()).rejects.toMatchObject({ status: 429 });
  });
});
