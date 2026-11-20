# AI Usage Log — Sprint 3

**Course:** SOEN 341 — Software Process
**Project:** CareerNet / CareerConnect
**Student:** Youssef Karnib
**Role:** Backend Developer
**Sprint:** November 4–16, 2026
**AI tool used:** ChatGPT (coding guidance, debugging, test design, and documentation)

**How prompts are recorded:** The prompts below are shortened, representative paraphrases of the requests used during development, not verbatim transcripts. They show the substantive AI assistance behind each pull request. All final code was checked against the project guide, local tests, and relevant Swagger workflows before submission. No API key or real applicant resume is reproduced in this log.

---

## Task 1 — YO-4: List Recruiter Postings

**Issue:** [#138](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/issues/138)
**Pull request:** [#176](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/176)

**Purpose of AI Use:** Implement a recruiter-only endpoint that lists the logged-in recruiter's jobs, including archived postings and application counts.

**Chat Link or Prompt/Response (representative prompts):**
- “Help me implement YO-4 using the existing FastAPI recruiter router and schemas. Include application counts and make sure recruiters only see their own postings.”
- “Guide me through the unit tests and Swagger verification before opening the PR.”

**AI-Suggested Content:** Suggested an outer-join/grouping approach for counts (including jobs with zero applicants), response-schema fields, authorization checks, and a focused test/PR workflow.

**Validation:** Compared behavior with the Sprint 3 guide, ran the YO-4 automated tests and backend suite, and checked the recruiter job-list response in Swagger UI.

**Decision:** Used the query and endpoint pattern after checking recruiter ownership and count behavior. Submitted the verified changes in PR #176.

**Reflection:** I learned why an outer join is important when listings must include jobs with no applications and how to test recruiter-only data access.

**Responsible Person:** Youssef Karnib

---

## Task 2 — YO-5: Edit, Archive and Unarchive Job Postings

**Issue:** [#139](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/issues/139)
**Pull request:** [#179](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/179)

**Purpose of AI Use:** Extend recruiter posting management with partial updates and archive/unarchive actions without changing other recruiters' postings.

**Chat Link or Prompt/Response (representative prompts):**
- “Implement YO-5 edit, archive and unarchive endpoints using our existing job models and status rules, without overwriting fields the recruiter did not change.”
- “Help test unauthorized edits, invalid fields, and archive/unarchive transitions.”

**AI-Suggested Content:** Proposed a partial-update schema, recruiter ownership checks, reusable job-status constants, endpoint structure, and regression tests for state transitions and errors.

**Validation:** Ran the new recruiter-posting tests and full test suite, then manually checked editing, archiving and unarchiving through Swagger UI.

**Decision:** Kept the changes that matched the team's status rules and existing API structure; submitted PR #179.

**Reflection:** I strengthened my understanding of partial PATCH requests, authorization at the database record level, and testing changes that affect multiple job states.

**Responsible Person:** Youssef Karnib

---

## Task 3 — YO-6: Filter Recruiter Applications

**Issue:** [#145](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/issues/145)
**Pull request:** [#177](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/177)

**Purpose of AI Use:** Add status and application-date filters to the existing recruiter applicant list while preserving ownership rules and the original response shape.

**Chat Link or Prompt/Response (representative prompts):**
- “Extend the recruiter applications endpoint with optional status, date_from and date_to filters, including input validation and inclusive date boundaries.”
- “Create targeted tests for filtered results and invalid date/status combinations without breaking the current endpoint.”

**AI-Suggested Content:** Explained conditional SQLAlchemy filters, UTC-aware inclusive date handling, invalid-filter responses, and test cases for individual and combined filters.

**Validation:** Ran eight focused recruiter-filter tests, the backend suite, and Swagger requests using status/date combinations and invalid inputs.

**Decision:** Used the filtering logic after verifying that it did not broaden access to another recruiter's applicants and did not remove existing functionality. Submitted PR #177.

**Reflection:** I learned how to implement optional filters safely and why date boundaries and timezone interpretation require dedicated tests.

**Responsible Person:** Youssef Karnib

---

## Task 4 — YO-7: Interview Scheduling and Status Notifications

**Issue:** [#146](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/issues/146)
**Pull request:** [#186](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/186)

**Purpose of AI Use:** Add interview dates to application status changes, create job-seeker notifications, and ensure the update and notification are consistent.

**Chat Link or Prompt/Response (representative prompts):**
- “Help implement YO-7 using Kaila's notification helper: preserve interview dates when appropriate, clear them when leaving Interview, and notify only on real changes.”
- “Debug the recruiter applications response and guide me through Swagger tests for duplicate notifications and invalid interview dates.”

**AI-Suggested Content:** Suggested UTC normalization, change detection, a single database commit for status and notification, schema changes exposing `interview_at`, and tests for authorization, duplicates and invalid combinations. Helped identify a misplaced line in the recruiter response construction.

**Validation:** Ran nine focused interview/notification tests and the full suite. In Swagger, scheduled an interview, inspected application responses, verified the notification record, repeated the request to check for duplicates, and confirmed HTTP 400 for an interview date with a non-Interview status.

**Decision:** Kept the transaction and change-detection approach because it matched the guide and passed the tested scenarios. Submitted PR #186.

**Reflection:** I learned why related database operations should commit together and how to prevent duplicate notifications from repeated requests.

**Responsible Person:** Youssef Karnib

---

## Task 5 — YO-9: Recruiter Downloads an Applicant's Resume

**Issue:** [#147](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/issues/147)
**Pull request:** [#194](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/194)

**Purpose of AI Use:** Provide an authorized recruiter download endpoint that reuses the existing stored-resume functionality.

**Chat Link or Prompt/Response (representative prompts):**
- “Read the existing resume CRUD and application/job models, then help create a recruiter endpoint that downloads only resumes submitted to the recruiter's own postings.”
- “Write tests for the owner recruiter, another recruiter, a job seeker, missing authentication, and a deleted resume.”

**AI-Suggested Content:** Proposed a separate applicant-resume router, an ownership-checked database join, the existing `Content-Disposition` file-download behavior, and five security-focused tests. Also helped troubleshoot missing local test dependencies.

**Validation:** All five YO-9 tests passed; the full backend suite reported 212 passed at that stage. Manually confirmed downloads and role restrictions in Swagger UI.

**Decision:** Reused the established resume response format while restricting access through the application and job owner; submitted PR #194.

**Reflection:** I learned why looking up a file by ID alone is unsafe and how to return the same 404 for inaccessible and nonexistent resources.

**Responsible Person:** Youssef Karnib

---

## Task 6 — YO-10: Gemini AI Resume Feedback Service

**Issue:** [#164](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/issues/164)
**Pull request:** [#199](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/199)

**Purpose of AI Use:** Build a service with free fake feedback and real Gemini-generated resume feedback, following the shared Pydantic schema and protecting sensitive resume text/API credentials.

**Chat Link or Prompt/Response (representative prompts):**
- “Implement YO-10 with fake mode, a safe prompt, response parsing and validation using `ResumeFeedback`, plus unit tests with no real API calls.”
- “Using Sayf's Gemini contract, replace `_call_provider` with an HTTP request, handle timeouts/errors safely, and test it without internet access.”
- “Help diagnose why the local real-mode check returns fake feedback, then an authentication error, without exposing the API key.”

**AI-Suggested Content:** Generated initial service and mock tests; recommended runtime environment settings, a prompt treating resume text as untrusted data, JSON validation/truncation, Gemini `generateContent` request structure, 20-second timeout, and sanitized provider errors. Guided local configuration diagnostics.

**Validation:** Eight initial tests passed; after Gemini integration, 11 YO-10 tests and the full 223-test backend suite passed. A direct Gemini request returned HTTP 200, followed by `generate_resume_feedback()` returning `mode="ai"` and relevant strengths, improvements, missing sections and keywords for a fictional junior developer resume. No real credentials or resume were committed.

**Decision:** Kept fake mode for keyless testing and the real Gemini integration after confirming Sayf's provider instructions and successful live testing. Submitted PR #199. The previously exposed test key was recommended for rotation.

**Reflection:** I learned to separate provider-independent logic from API calls, mock network boundaries, validate generated JSON against a schema, and avoid leaking secrets during debugging.

**Responsible Person:** Youssef Karnib

---

## Task 7 — YO-8: Sprint 3 Personal Report and Documentation

**Issue:** N/A
**Report:** `AI_Doc/Youssef/Sprint 3 Report.pdf` (YO-8 PR not yet recorded)

**Purpose of AI Use:** Organize the verified Sprint 3 contributions into a personal report and document representative AI assistance for assessment.

**Chat Link or Prompt/Response (representative prompts):**
- “Create my personal Sprint 3 report using my task work, recorded hours, GitHub issues and pull requests, and explain what I can demonstrate in the lab.”
- “Keep the report content but redesign it in black and white and remove the pending-items section.”
- “Use the same AI-log format we used in Sprint 2, with a few meaningful prompts per pull request rather than every chat message.”

**AI-Suggested Content:** Produced a report draft, incorporated the supplied task hours and PR/issue references, helped compare it with a teammate's report, adjusted the visual design, and drafted this AI usage log.

**Validation:** Reviewed the PDF, supplied and checked the task hours and issue/PR references, requested specific layout changes, and reviewed the resulting versions. This log should be reviewed against the user's existing partial entries before being committed.

**Decision:** Kept the concise report and monochrome layout and selected representative prompts for the AI log instead of copying every debugging exchange.

**Reflection:** I learned to distinguish AI-produced documentation from records I could verify, particularly actual time spent, PR references and testing outcomes.

**Responsible Person:** Youssef Karnib

---

## Final Outcome

ChatGPT assisted with backend implementation, debugging, test design, API verification and documentation throughout Sprint 3. I accepted suggestions only after comparing them with the team requirements and testing the behavior locally. The recorded tests are checkpoints from different stages of the sprint, **not additive totals**. Sensitive API keys and real resume contents are intentionally excluded.

**Project repository:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-/
**Sprint 3 report:** `AI_Doc/Youssef/Sprint 3 Report.pdf`
