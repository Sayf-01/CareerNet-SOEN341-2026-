# Sprint 3 Contribution Log

**SOEN 341: CareerConnect**
**Youssef Karnib — Backend Team**
**Sprint:** November 4–16, 2026
**Repository:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-
**Intended repository path:** `Documentation/Sprint 3/Contribution Log - Youssef.md`

## Overview

During Sprint 3, I worked on the recruiter-facing backend and the AI resume feedback service. I implemented endpoints to list and manage recruiter job postings, filter applicants, schedule interviews with notifications, and securely retrieve applicant resumes. I also built the Gemini-based resume feedback service with a key-free fake mode. My work included automated tests, Swagger UI checks, and a local end-to-end test of the Gemini provider using fictional resume text.

**Total time spent: 13.5 hours**, based on my reported task hours, including 1 hour for YO-8 documentation. The task-level hours below are confirmed; exact hours for individual work sessions were not separately supplied.

## YO-4 — List My Recruiter Postings

**Goal:** Allow a recruiter to list their own postings, including archived postings and application counts.

**What I did:**
- Implemented the authenticated `GET /api/v1/recruiter/jobs` endpoint.
- Returned only postings owned by the logged-in recruiter, with application counts that include jobs with zero applications.
- Added/ran tests and verified the recruiter posting flow.

**Verification:** Tested recruiter access and posting-list behavior through automated checks and Swagger UI before submitting the pull request.

**Time spent:** 2 hours.

**Links:** [Issue #138](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/issues/138) · [PR #176](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/176)

## YO-5 — Edit, Archive and Unarchive Postings

**Goal:** Let recruiters edit and manage the visibility of their own job postings.

**What I did:**
- Implemented recruiter-only updates and archive/unarchive operations.
- Preserved ownership checks and the existing job-status rules.
- Added tests for valid updates and unauthorized or invalid operations.

**Verification:** Checked editing and archive/unarchive behavior using Swagger UI and automated regression tests.

**Time spent:** 2.5 hours.

**Links:** [Issue #139](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/issues/139) · [PR #179](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/179)

## YO-6 — Filter Applicants by Status and Date

**Goal:** Allow recruiters to filter applicants for their own posting using status and application date boundaries.

**What I did:**
- Extended the recruiter applications endpoint with `status`, `date_from` and `date_to` filters.
- Supported inclusive UTC date boundaries and rejected invalid filter values.
- Added dedicated tests for filtering and access restrictions.

**Verification:** The dedicated recruiter-filter test file passed eight tests during development. Verified filter responses and invalid-input behavior before the PR.

**Time spent:** 1.5 hours.

**Links:** [Issue #145](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/issues/145) · [PR #177](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/177)

## YO-7 — Interview Scheduling and Notifications

**Goal:** Let recruiters change application status, schedule interviews, and notify the applicant only when something changes.

**What I did:**
- Extended `PATCH /api/v1/applications/{id}/status` with an optional interview date/time.
- Normalized dates to UTC, preserved dates for repeated Interview updates, and cleared them when leaving Interview status.
- Added notification creation only when the status or interview time actually changed, with one database commit for the update and notification.
- Exposed `interview_at` in recruiter and job-seeker application responses.

**Verification:** Nine dedicated YO-7 tests passed. Manually tested the Interview flow, notification records, repeated identical requests and HTTP 400 validation in Swagger UI. Resolved a local database migration/schema mismatch during verification.

**Time spent:** 2.5 hours.

**Links:** [Issue #146](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/issues/146) · [PR #186](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/186)

## YO-9 — Recruiter Downloads an Applicant's Resume

**Goal:** Let the owner of a job posting download a resume submitted with an application, without exposing other applicants' files.

**What I did:**
- Added `GET /api/v1/applications/{application_id}/resume` in a separate router.
- Added a database lookup that checks the application, resume ownership and the posting's recruiter.
- Reused the existing resume response headers and file bytes; returned appropriate 401, 403 and 404 responses.
- Added five dedicated security and download tests.

**Verification:** All five YO-9 tests passed; the full backend suite passed **212 tests** at that stage. Verified resume download and role restrictions through Swagger UI.

**Time spent:** 1.5 hours.

**Links:** [Issue #147](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/issues/147) · [PR #194](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/194)

## YO-10 — AI Resume Feedback Service

**Goal:** Generate structured resume feedback in fake mode without an API key and in real mode using the selected Gemini model.

**What I did:**
- Created `App/services/ai_feedback.py` using the shared `ResumeFeedback` schema.
- Implemented fake feedback, runtime environment settings, a prompt that treats resume text as untrusted data, JSON parsing, length limits and sanitized errors.
- Integrated Gemini `generateContent` using the API key in an HTTP header and a 20-second timeout; used `gemini-3.5-flash-lite` for the successful local check.
- Added 11 tests covering fake/real-mode logic, response validation, provider success, HTTP failure and timeouts, with mocked network calls.

**Verification:** All 11 YO-10 tests passed, and the full backend suite passed **223 tests**. The real Gemini API returned HTTP 200 and the service produced `mode="ai"` with relevant strengths, improvements, missing sections and keywords for a fictional software developer resume. No actual API key or personal resume text was committed.

**Time spent:** 2.5 hours.

**Links:** [Issue #164](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/issues/164) · [PR #199](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/199)

## YO-8 — Personal Sprint 3 Report and Documentation

**Goal:** Summarize my individual work, testing evidence, time and AI assistance for Sprint 3.

**What I did:**
- Prepared a three-page Sprint 3 report with task descriptions, issue/PR references, verified testing milestones and lab demonstration topics.
- Reviewed the report against a teammate's contribution report, then adjusted the formatting to a black-and-white layout.
- Prepared the Sprint 3 AI Usage Log in Markdown and this contribution log.

**Verification:** Reviewed the documentation against my Sprint 3 Personal Guide and the known task, testing and PR records. The documentation PR is not assigned a number here because none was supplied.

**Time spent:** 1 hour.

**Links:** Issue: N/A · Documentation PR: **to be added after creation**.

## Time Summary

| Task | Recorded time | Pull request |
|---|---:|---|
| YO-4 | 2 hours | [#176](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/176) |
| YO-5 | 2.5 hours | [#179](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/179) |
| YO-6 | 1.5 hours | [#177](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/177) |
| YO-7 | 2.5 hours | [#186](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/186) |
| YO-9 | 1.5 hours | [#194](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/194) |
| YO-10 | 2.5 hours | [#199](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/199) |
| YO-8 | 1 hour | Pending documentation PR |
| **Total** | **13.5 hours** | |

## Verification and Learning

I used separate feature branches and pull requests, added tests for each backend feature, and checked the key user flows in Swagger UI. In particular, I learned to enforce recruiter ownership in database queries, prevent repeated notifications for unchanged data, distinguish local migration issues from endpoint bugs, and validate AI-provider output before returning it to the frontend. For AI assistance, see `AI_Doc/Youssef/AI Usage Log - Sprint 3.md`.

## Work-Session Record Note

The sprint-level task hours above were supplied from my personal time record. A separate dated breakdown by individual work session, commit IDs, or meeting contributions has **not been verified**, so no such details have been invented in this log. The issue and PR links provide traceability to the actual code and review history.
