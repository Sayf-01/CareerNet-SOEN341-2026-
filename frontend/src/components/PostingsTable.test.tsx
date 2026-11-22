
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

import PostingsTable from "./PostingsTable";
import type { RecruiterPosting } from "../api/recruiter";

const mockJobs: RecruiterPosting[] = [
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

function renderTable(jobs: RecruiterPosting[]) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <PostingsTable jobs={jobs} />
    </MemoryRouter>
  );
}

describe("PostingsTable - KR-6", () => {
  it("displays all recruiter job postings", () => {
    const html = renderTable(mockJobs);

    expect(html).toContain("Junior Software Developer");
    expect(html).toContain("CareerNet Demo Company");
    expect(html).toContain("Montreal");
    expect(html).toContain("Software Development");

    expect(html).toContain("UI Designer");
    expect(html).toContain("Design Studio");
    expect(html).toContain("Toronto");
  });

  it("displays statuses and application counts", () => {
    const html = renderTable(mockJobs);

    expect(html).toContain("Open");
    expect(html).toContain("Archived");

    expect(html).toMatch(/>3<\/td>/);
    expect(html).toMatch(/>0<\/td>/);
  });

  it("provides a Manage link for each job", () => {
    const html = renderTable(mockJobs);

    expect(html).toContain(
      'href="/recruiter/jobs/19"'
    );

    expect(html).toContain(
      'href="/recruiter/jobs/20"'
    );
  });

  it("shows an empty message when no postings exist", () => {
    const html = renderTable([]);

    expect(html).toContain("No postings yet.");
    expect(html).not.toContain("<table");
  });
});
