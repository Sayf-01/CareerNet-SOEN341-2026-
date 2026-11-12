import { afterEach, describe, expect, it, vi } from "vitest";
import { getApplicationsForJob } from "./recruiter";
import { apiFetch } from "./client";

vi.mock("./client");

afterEach(() => vi.resetAllMocks());

describe("getApplicationsForJob", () => {
  it("sends no query string when no filter is set", async () => {
    vi.mocked(apiFetch).mockResolvedValue([]);
    await getApplicationsForJob(5);
    expect(apiFetch).toHaveBeenCalledWith("/recruiter/jobs/5/applications");
  });

  it("only sends the filters that are set", async () => {
    vi.mocked(apiFetch).mockResolvedValue([]);
    await getApplicationsForJob(5, { status: "Under Review", dateFrom: "2026-11-01", dateTo: "" });
    expect(apiFetch).toHaveBeenCalledWith(
      "/recruiter/jobs/5/applications?status=Under+Review&date_from=2026-11-01",
    );
  });
});
