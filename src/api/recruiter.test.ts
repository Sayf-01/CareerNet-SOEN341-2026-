
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import * as client from "./client";

import {
  getMyJobs,
  createJob,
  updateJob,
  archiveJob,
  unarchiveJob,
  updateApplicationStatus,
  downloadApplicantResume,
  type CreateJobData,
  type RecruiterPosting,
  type RecruiterJob,
} from "./recruiter";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Recruiter API - KR-6", () => {
  it("retrieves the recruiter's job postings", async () => {
    const postings: RecruiterPosting[] = [
      {
        id: 19,
        title: "Junior Software Developer",
        company: "CareerNet Demo Company",
        location: "Montreal",
        category: "Software Development",
        status: "open",
        posted_at: "2026-11-05T12:00:00Z",
        application_count: 3,
      },
      {
        id: 20,
        title: "UI Designer",
        company: "Design Studio",
        location: "Toronto",
        category: "Design",
        status: "archived",
        posted_at: "2026-11-04T12:00:00Z",
        application_count: 0,
      },
    ];

    const apiSpy = vi
      .spyOn(client, "apiFetch")
      .mockResolvedValue(postings);

    const result = await getMyJobs();

    expect(apiSpy).toHaveBeenCalledWith(
      "/recruiter/jobs"
    );

    expect(result).toEqual(postings);
    expect(result).toHaveLength(2);
    expect(result[0].application_count).toBe(3);
    expect(result[1].status).toBe("archived");
  });

  it("creates a job using POST and JSON", async () => {
    const newJob: CreateJobData = {
      title: "Software Developer",
      company: "CareerNet",
      location: "Montreal",
      category: "Software Development",
      description: "Develop web applications.",
    };

    const createdJob: RecruiterJob = {
      ...newJob,
      id: 21,
      status: "open",
      posted_at: "2026-11-05T14:00:00Z",
    };

    const apiSpy = vi
      .spyOn(client, "apiFetch")
      .mockResolvedValue(createdJob);

    const result = await createJob(newJob);

    expect(apiSpy).toHaveBeenCalledWith(
      "/recruiter/jobs",
      {
        method: "POST",
        body: JSON.stringify(newJob),
      }
    );

    expect(result.id).toBe(21);
    expect(result.title).toBe("Software Developer");
    expect(result.status).toBe("open");
  });

  it("propagates API errors when loading postings", async () => {
    vi.spyOn(client, "apiFetch").mockRejectedValue(
      new client.ApiError(
        "Unable to load job postings.",
        500
      )
    );

    await expect(getMyJobs()).rejects.toThrow(
      "Unable to load job postings."
    );
  });
});

describe("Recruiter Edit and Archive API - KR-7", () => {
  const existingJob: RecruiterJob = {
    id: 34,
    title: "Software Developer",
    company: "CareerNet Test",
    location: "Montreal",
    category: "Software Development",
    description: "Develop web applications.",
    status: "open",
    posted_at: "2026-11-07T18:58:43Z",
  };

  it("updates only the changed job fields", async () => {
    const changedFields = {
      title: "Senior Software Developer",
    };

    const updatedJob: RecruiterJob = {
      ...existingJob,
      ...changedFields,
    };

    const apiSpy = vi
      .spyOn(client, "apiFetch")
      .mockResolvedValue(updatedJob);

    const result = await updateJob(34, changedFields);

    expect(apiSpy).toHaveBeenCalledWith(
      "/recruiter/jobs/34",
      {
        method: "PATCH",
        body: JSON.stringify(changedFields),
      }
    );

    expect(result.title).toBe("Senior Software Developer");
  });

  it("archives an existing job", async () => {
    const archivedJob: RecruiterJob = {
      ...existingJob,
      status: "archived",
    };

    const apiSpy = vi
      .spyOn(client, "apiFetch")
      .mockResolvedValue(archivedJob);

    const result = await archiveJob(34);

    expect(apiSpy).toHaveBeenCalledWith(
      "/recruiter/jobs/34/archive",
      {
        method: "POST",
      }
    );

    expect(result.status).toBe("archived");
  });

  it("unarchives a job", async () => {
    const apiSpy = vi
      .spyOn(client, "apiFetch")
      .mockResolvedValue(existingJob);

    const result = await unarchiveJob(34);

    expect(apiSpy).toHaveBeenCalledWith(
      "/recruiter/jobs/34/unarchive",
      {
        method: "POST",
      }
    );

    expect(result.status).toBe("open");
  });
});


describe("Applicant Status and Resume API - KR-9", () => {
  it("sends the interview status with an ISO date", async () => {
    const interviewAt = "2026-11-20T15:30:00.000Z";

    const updated = {
      id: 101,
      status: "Interview",
      interview_at: interviewAt,
      updated_at: "2026-11-16T10:00:00Z",
    };

    const apiSpy = vi
      .spyOn(client, "apiFetch")
      .mockResolvedValue(updated);

    const result = await updateApplicationStatus(
      101,
      "Interview",
      interviewAt
    );

    expect(apiSpy).toHaveBeenCalledWith(
      "/applications/101/status",
      {
        method: "PATCH",
        body: JSON.stringify({
          status: "Interview",
          interview_at: interviewAt,
        }),
      }
    );

    expect(result.status).toBe("Interview");
    expect(result.interview_at).toBe(interviewAt);
  });

  it("does not send an interview date for other statuses", async () => {
    const apiSpy = vi
      .spyOn(client, "apiFetch")
      .mockResolvedValue({
        id: 101,
        status: "Under Review",
        interview_at: null,
        updated_at: "2026-11-16T10:00:00Z",
      });

    await updateApplicationStatus(101, "Under Review");

    expect(apiSpy).toHaveBeenCalledWith(
      "/applications/101/status",
      {
        method: "PATCH",
        body: JSON.stringify({
          status: "Under Review",
        }),
      }
    );
  });

  it("downloads an applicant resume as a Blob", async () => {
    const resumeBlob = new Blob(["Sample resume"], {
      type: "application/pdf",
    });

    const apiSpy = vi
      .spyOn(client, "apiFetch")
      .mockResolvedValue(resumeBlob);

    const result = await downloadApplicantResume(101);

    expect(apiSpy).toHaveBeenCalledWith(
      "/applications/101/resume"
    );

    expect(result).toBe(resumeBlob);
  });

  it("propagates errors when a resume is unavailable", async () => {
    vi.spyOn(client, "apiFetch").mockRejectedValue(
      new client.ApiError("Resume not found.", 404)
    );

    await expect(
      downloadApplicantResume(101)
    ).rejects.toMatchObject({
      status: 404,
      message: "Resume not found.",
    });
  });
});