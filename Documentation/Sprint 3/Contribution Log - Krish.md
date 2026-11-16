# CareerNet — Sprint 3 Contribution Log

**Student:** Krish Patel  
**Course:** SOEN 341 — Software Process  
**Project:** CareerNet  
**Role:** Frontend Developer  
**Sprint:** 3 (November 4–16, 2026)

## KR-5 — Real API Integration Cleanup and Unit Testing

**Date:** November 5, 2026  
**Time Spent:** 3 Hours  
**Priority:** P1  
**Status:** Completed and merged

### Work Completed

1. Verified that the real API integration from the previous sprint was merged into the main branch through PR #121.
2. Created feature/KR-5-real-api-integration from the updated main branch.
3. Compared the existing profile and resume API implementations with Kaila's branch and confirmed that the existing implementation supported the required functionality.
4. Removed unused mock job and application data files.
5. Corrected TypeScript authentication types to match the real FastAPI responses.
6. Updated the optional mock-login response to use the corrected user structure.
7. Removed an outdated mock API comment from the Jobs page.
8. Added four Vitest unit tests for job searching, profile retrieval, profile saving, and My Applications.
9. Ran unit tests, ESLint, production build, and Git validation checks.
10. Committed the changes, pushed the feature branch, and created PR #129 for team review.
11. Confirmed that GitHub CI passed and PR #129 was merged into main.

### Files Modified

- src/api/integration.test.ts — Added.
- src/mocks/applications.ts — Removed.
- src/mocks/jobs.ts — Removed.
- src/pages/JobsPage.tsx — Updated comment.
- src/services/authService.ts — Corrected mock-login response.
- src/types/auth.ts — Corrected authentication types.

### Testing Results

- Frontend unit tests: 5/5 passed.
- ESLint: Passed.
- Production build: Passed.
- Git whitespace validation: Passed.
- GitHub CI: Passed.

### Challenges and Resolutions

**Challenge 1:** Two branches contained overlapping profile and resume API code.

**Resolution:** Compared both implementations and retained the existing version after confirming functional equivalence.

**Challenge 2:** Unused mock data remained after the real API integration.

**Resolution:** Checked for imports and removed the unused mock files.

**Challenge 3:** Frontend authentication types did not match backend responses.

**Resolution:** Updated the TypeScript types and mock-login response, then verified the production build.

**Challenge 4:** The frontend had limited automated test coverage.

**Resolution:** Added four integration-layer unit tests using mocked API calls and verified all five frontend tests passed.

### GitHub References

**Repository:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-

**Original API Integration PR:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/121

**KR-5 Completion PR:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/129

**Commit:** 2eb7806

### AI Assistance

Used ChatGPT for implementation guidance, branch comparison, TypeScript corrections, unit test generation, and Git workflow instructions. All proposed changes were reviewed and validated with local tests and CI.

---

## KR-6 — Recruiter Job Postings List

**Date:** November 5–7, 2026  
**Time Spent:** 4 Hours  
**Priority:** P1  
**Status:** Completed and merged (PR #134)

### Work Completed

1. Updated the local main branch and created feature/KR-6-postings-list for the recruiter postings list feature.
2. Added the RecruiterPosting TypeScript interface and getMyJobs() API function to retrieve the logged-in recruiter's job postings.
3. Created a reusable PostingForm.tsx component with required-field validation for creating job postings and supporting future editing functionality.
4. Created PostingsTable.tsx to display job title, company, location, category, status, posting date, application count, and Manage links.
5. Refactored RecruiterDashboardPage.tsx to display the postings list, handle loading, empty and error states, and refresh the list after creating a job.
6. Removed the duplicate job-category definition and used the existing shared categories constant.
7. Added a protected /recruiter/jobs/:id route and RecruiterJobPage.tsx to display applications received for an individual posting.
8. Created automated tests for the postings table, form validation, recruiter API functions, and automatic dashboard refresh.
9. Installed React Testing Library and jsdom as development dependencies for frontend component testing.
10. Fixed a React Router issue that initially caused the Manage Posting page to display a blank screen.
11. Manually verified that the Manage Posting page displayed an existing application for Job #21.
12. Created a test job through the Recruiter Dashboard and verified that Job #34 was successfully saved in PostgreSQL with recruiter ID 14 and status open.
13. Identified that the live postings list depends on Youssef's YO-4 backend endpoint, which was not available in the tested backend version.
14. Ran unit tests, ESLint, production build, and Git formatting checks.
15. Committed the changes as a61887f, pushed the feature branch, and created PR #134 for team review.
16. Confirmed that GitHub CI checks passed. PR #134 was subsequently merged into main.

### Files Modified

- src/api/recruiter.ts — Added recruiter postings list API function and TypeScript interface.
- src/api/recruiter.test.ts — Added recruiter API unit tests.
- src/components/PostingForm.tsx — Added reusable job posting form.
- src/components/PostingsTable.tsx — Added recruiter postings table.
- src/components/PostingsTable.test.tsx — Added postings table unit tests.
- src/components/postingValidation.ts — Added reusable posting validation.
- src/components/postingValidation.test.ts — Added posting validation tests.
- src/pages/RecruiterDashboardPage.tsx — Refactored dashboard and added automatic list refresh.
- src/pages/RecruiterDashboardPage.test.tsx — Added dashboard creation and refresh test.
- src/pages/RecruiterJobPage.tsx — Added Manage Posting page.
- src/App.tsx — Added protected recruiter management route.
- package.json — Added frontend testing dependencies.
- package-lock.json — Updated dependency lockfile.

### Testing Results

- Frontend unit tests: 17/17 passed across 6 test files.
- ESLint: Passed.
- Production build: Passed.
- Git whitespace validation: Passed.
- GitHub CI: Passed.
- Job creation API: Passed.
- PostgreSQL verification: Job #34 successfully saved.
- Manage Posting page: Successfully displayed an existing application.
- Automatic postings-list refresh: Passed using mocked API responses.
- Live postings list: Pending YO-4 backend integration.

### Challenges and Resolutions

**Challenge 1:** The recruiter dashboard contained a large form and temporary manual job ID functionality.

**Resolution:** Extracted a reusable PostingForm and created a dedicated PostingsTable. Refactored the dashboard to manage job listings and creation in a cleaner structure.

**Challenge 2:** The Manage Posting page initially displayed a blank screen because of incorrect React Router configuration.

**Resolution:** Checked the browser Console, moved the route inside the existing Routes component, and verified that the page displayed successfully.

**Challenge 3:** Some existing jobs could not be accessed by the logged-in recruiter.

**Resolution:** Confirmed that the backend only allows recruiters to view applications for their own postings. Tested the page using Job #21, which belonged to the logged-in account.

**Challenge 4:** The recruiter postings list displayed "Method Not Allowed" when requesting job data.

**Resolution:** Checked the FastAPI documentation and confirmed that GET /api/v1/recruiter/jobs was missing from the running backend. Identified this as a dependency on Youssef's YO-4 task. Used mocked API responses to verify frontend list functionality while waiting for backend integration.

**Challenge 5:** Automated tests needed to verify user interactions and automatic list refreshing.

**Resolution:** Added React Testing Library and jsdom as development dependencies. Created component tests covering posting creation and automatic dashboard refresh. Confirmed all 17 frontend tests passed.

### GitHub References

**Repository:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-

**KR-6 Pull Request:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/134

**Branch:** feature/KR-6-postings-list

**Commit:** a61887f

**Pull Request Status:** Merged into main.

**Backend dependency during development:** YO-4 - Recruiter Job Listing Endpoint.

### AI Assistance

Used ChatGPT for step-by-step implementation guidance, reusable React component development, API integration, form validation, unit test generation, browser error troubleshooting, PostgreSQL verification queries, and Git workflow instructions.

All proposed code changes were reviewed and implemented locally. The feature was validated through 17 passing frontend tests, ESLint, the production build, manual browser testing, PostgreSQL verification, and GitHub CI.

The frontend implementation is submitted for review, with live postings-list integration testing pending the YO-4 backend endpoint.

---

## KR-7 - Recruiter Posting Edit and Archive UI

**Date:** November 9, 2026  
**Time Spent:** 3 Hours  
**Priority:** P1  
**Status:** Completed and merged (PR #174); live integration not independently verified in this log

### Work Completed

1. Reviewed the KR-7 requirements from the Sprint 3 personal guide and GitHub issue #141.
2. Created feature/KR-7-edit-archive from the existing KR-6 feature branch because the recruiter postings list had not yet been merged into main.
3. Updated src/api/recruiter.ts by adding updateJob(), archiveJob(), and unarchiveJob() API functions using the required PATCH and POST endpoints.
4. Updated the RecruiterJob TypeScript interface to support both open and archived posting statuses.
5. Updated RecruiterJobPage.tsx to retrieve an existing posting using getJob() and load its details into the reusable PostingForm component.
6. Implemented editing functionality that compares the existing posting with the submitted form values and sends only changed fields to the backend.
7. Added success and error messages for editing job postings, including a message when no changes are detected.
8. Added Archive and Unarchive buttons with a confirmation message explaining that archived postings disappear from search, cannot receive new applications, and retain existing applications.
9. Updated the posting management page to display the job title and current status together.
10. Updated JobDetailPage.tsx to hide the Apply button and display "This job is closed." whenever a job is not open.
11. Preserved the existing applications list and added an integration comment for Dany's future DA-9 ApplicantsPanel component.
12. Added automated API tests for the update, archive, and unarchive functions.
13. Added component tests for loading existing posting values, saving only changed fields, cancelling archive confirmation, archiving, unarchiving, and handling API errors.
14. Added job detail page tests confirming that archived postings hide the Apply button while open postings allow applications.
15. Corrected a TypeScript test error caused by the difference between JobDetail and RecruiterJob status types.
16. Prepared and updated the AT-1 acceptance test draft in GitHub issue #142, including manual test scenarios, automated test references, and pending integration results.
17. Ran all frontend unit tests, ESLint, production build, and Git whitespace validation checks.
18. Reviewed the staged changes, committed them as a17f684, and pushed the KR-7 feature branch to GitHub.
19. Created PR #174 targeting feature/KR-6-postings-list and requested reviews from Sayf and Dany.
20. Confirmed that PR #174 contains one commit and seven changed files. PR #174 was subsequently merged into main.

### Files Modified

- src/api/recruiter.ts - Added update, archive, and unarchive API functions and updated the recruiter job status type.
- src/api/recruiter.test.ts - Added tests for the new recruiter API functions.
- src/pages/RecruiterJobPage.tsx - Added posting editing, archive/unarchive controls, confirmation handling, status display, and feedback messages.
- src/pages/RecruiterJobPage.test.tsx - Added component tests covering editing, archiving, unarchiving, confirmation, and error handling.
- src/pages/JobDetailPage.tsx - Updated the Apply-button condition to restrict applications to open jobs.
- src/pages/JobDetailPage.test.tsx - Added tests for Apply-button visibility on open and archived postings.
- src/types/job.ts - Updated job status types to include archived postings.

### Testing Results

- Frontend unit tests: 29/29 passed across 8 test files.
- ESLint: Passed.
- Production build: Passed.
- Git whitespace validation: Passed.
- Existing posting values displayed in the edit form: Passed using mocked API responses.
- Saving only changed fields: Passed using mocked API responses.
- Archive confirmation and cancellation: Passed.
- Unarchive functionality: Passed using mocked API responses.
- Update and archive API error handling: Passed.
- Archived-job Apply-button visibility: Passed.
- GitHub CI: No checks reported for PR #174 at the time of verification.
- Live edit/archive integration: Not verified in the recorded testing session.
- Full AT-1 acceptance test: Draft completed; end-to-end execution pending backend integration.

### Challenges and Resolutions

**Challenge 1:** The KR-7 feature depended on the reusable form and posting management page developed in KR-6, which had not yet been merged into main.

**Resolution:** Created the KR-7 branch from KR-6 and submitted a separate stacked pull request targeting the KR-6 feature branch.

### GitHub References

**Repository:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-

**GitHub Issue:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-/issues/141

**KR-7 Pull Request:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/174

**Branch:** `feature/KR-7-edit-archive`  
**Commit:** `a17f684`  
**Pull Request Status:** Merged into main.  
**Backend dependency during development:** YO-5 - Edit and Archive Posting Endpoints.

### AI Assistance

Used ChatGPT for guidance on the posting edit/archive API functions, reusing PostingForm, confirmation and error handling, frontend tests, TypeScript test corrections, acceptance test preparation, and the Git workflow. All proposed code was reviewed and validated with local tests, lint, build, and Git checks.


---

## KR-9 - Applicant Status, Interview Scheduling and Resume Viewing

**Date:** November 2026  
**Time Spent:** 2 Hours  
**Priority:** P1 (Resume viewing: P2)  
**Status:** Frontend implementation completed, PR #200 open, awaiting team review

### Work Completed

1. Reviewed the KR-9 requirements from the Sprint 3 personal guide and GitHub issue #149.
2. Created feature/KR-9-status-interview from the main branch.
3. Reviewed the existing ApplicantsPanel component and recruiter API functions.
4. Added updateApplicationStatus() to src/api/recruiter.ts for updating an applicant's status and optional interview date.
5. Created a reusable ApplicantRow.tsx component to manage each applicant separately.
6. Added a status dropdown with five available statuses and a Save button for each applicant.
7. Added an interview date and time input that appears when Interview is selected.
8. Converted the selected local interview date and time to ISO format before sending it to the backend.
9. Ensured that interview_at is not included when the selected status is not Interview.
10. Added loading states to prevent repeated status updates while saving.
11. Updated the displayed application status and interview date after a successful save.
12. Added success and error messages for application status changes.
13. Implemented the optional View Resume button using an authenticated API request.
14. Added handling for unavailable resumes and opening the downloaded file in a new browser tab.
15. Created 11 ApplicantRow component tests covering status changes, interview scheduling, error handling, and resume viewing.
16. Added four recruiter API tests for the new backend requests.
17. Ran the frontend test suite, ESLint, production build, and Git whitespace checks.
18. Reviewed the changes, created commit 0a83488, and pushed the feature branch.
19. Created PR #200 targeting main and requested reviews from Sayf and Dany.
20. Confirmed that both GitHub CI checks passed.

### Files Modified

- src/api/recruiter.ts - Added application status update and authenticated resume download API functions.
- src/api/recruiter.test.ts - Added recruiter API tests.
- src/components/ApplicantRow.tsx - Added applicant status controls, interview scheduling, resume viewing, and user feedback.
- src/components/ApplicantRow.test.tsx - Added component tests for the new functionality.

### Testing Results

- Frontend unit tests: 87/87 passed across 20 test files.
- Applicant component tests: 11 passed.
- New recruiter API tests: 4 passed.
- ESLint: Passed.
- Production build: Passed.
- Git whitespace validation: Passed.
- Status selection and saving: Passed using mocked API responses.
- Interview date formatting: Passed.
- Saving a non-Interview status without an interview date: Passed.
- API error handling: Passed.
- Resume viewing behavior: Passed using mocked API responses.
- GitHub CI: Both checks passed.
- Live recruiter/backend integration: Pending final verification.

### Challenges and Resolutions

**Challenge 1:** The new status controls needed to work with Dany's existing applicant list without affecting its filtering functionality.

**Resolution:** Created a separate ApplicantRow component to keep the status controls and resume actions organized for each applicant.

**Challenge 2:** Interview dates entered in the browser use local time, while the backend expects ISO date-time values.

**Resolution:** Converted the selected date and time using toISOString() before sending the request. Added tests to verify the conversion.

**Challenge 3:** The backend accepts interview_at only when the status is Interview.

**Resolution:** Updated the API request logic to include the interview date only when required.

**Challenge 4:** Resume downloads require authentication, so opening a direct file URL would not reliably include the login token.

**Resolution:** Used the authenticated API client to retrieve the resume and implemented opening the returned file in a browser tab.

**Challenge 5:** The live backend workflow was not fully verified during frontend development.

**Resolution:** Added mocked component and API tests to validate the frontend behavior. Kept the live integration test as a remaining verification step.

### GitHub References

**Repository:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-  
**GitHub Issue:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-/issues/149  
**KR-9 Pull Request:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/200  
**Branch:** feature/KR-9-status-interview  
**Commit:** 0a83488  
**Pull Request Status:** Open, awaiting review from Sayf and Dany. Both CI checks passed.

### AI Assistance

Used ChatGPT for step-by-step implementation guidance, React component development, API integration, interview date formatting, resume download handling, automated tests, error troubleshooting, and Git workflow instructions.

I reviewed the suggested changes and verified the implementation through 87 passing frontend tests, ESLint, the production build, Git validation, and GitHub CI. Final live backend testing remains pending.

---

## KR-11 - AI Resume Feedback Button

**Date:** November 16, 2026  
**Time Spent:** 2.5 Hours  
**Priority:** P1  
**Status:** Frontend implementation completed, PR #201 open, awaiting team review

### Work Completed

1. Reviewed the KR-11 requirements from the Sprint 3 personal guide and GitHub issue #167.
2. Created feature/KR-11-ai-feedback-button from the main branch.
3. Reviewed the existing ResumeSection, FeedbackPanel, resume API functions, and feedback TypeScript interface.
4. Added getResumeFeedback(id) to src/api/resumes.ts using the existing authenticated API client.
5. Connected the API function to the required POST /api/v1/resumes/{id}/feedback endpoint.
6. Added a Get AI feedback button beside each uploaded resume in ResumeSection.tsx.
7. Added the required privacy confirmation message before sending resume text for AI feedback.
8. Ensured that cancelling the confirmation does not make an API request.
9. Added React state to track the selected resume, feedback response, loading state, and error messages.
10. Integrated Dany's existing FeedbackPanel component to display the feedback.
11. Displayed the feedback panel for only one resume at a time.
12. Added loading behavior while a feedback request is processing.
13. Disabled conflicting resume actions during feedback loading, including the Upload Resume button.
14. Added error handling for backend responses, including 422 and 503 errors.
15. Kept feedback in component state instead of permanently storing or caching it.
16. Created ResumeSection.test.tsx with seven tests for confirmation, cancellation, successful feedback, loading states, and errors.
17. Created resumes.feedback.test.ts with three tests for the feedback API request and HTTP error handling.
18. Ran all frontend tests, ESLint, the production build, and Git whitespace checks.
19. Reviewed the implementation and made a final adjustment to the Upload Resume loading behavior.
20. Reran the checks and confirmed that all 82 frontend tests passed.
21. Committed the changes as 3ea7141 and pushed the feature branch to GitHub.
22. Created PR #201 targeting main and requested reviews from Sayf and Dany.
23. Confirmed that both GitHub CI checks passed.

### Files Modified

- src/api/resumes.ts - Added the getResumeFeedback API function.
- src/api/resumes.feedback.test.ts - Added API tests for feedback requests and error responses.
- src/components/ResumeSection.tsx - Added the AI feedback button, confirmation dialog, feedback display, loading states, and error handling.
- src/components/ResumeSection.test.tsx - Added component tests for the new feedback functionality.

### Testing Results

- Frontend unit tests: 82/82 passed across 21 test files.
- ResumeSection component tests: 7 passed.
- Resume feedback API tests: 3 passed.
- ESLint: Passed.
- Production build: Passed.
- Git whitespace validation: Passed.
- Privacy confirmation dialog: Passed.
- Cancelling feedback confirmation: Passed.
- Correct resume ID sent to the API: Passed.
- Feedback panel display: Passed.
- Only one feedback panel displayed at a time: Passed.
- Backend error handling for 422 and 503: Passed using mocked responses.
- Buttons disabled during feedback loading: Passed.
- GitHub CI: Both checks passed.
- Live AI feedback endpoint: Pending final integration testing.

### Challenges and Resolutions

**Challenge 1:** The new AI feedback feature needed to reuse Dany's existing FeedbackPanel without changing how resume uploads, downloads, and replacements worked.

**Resolution:** Added the feedback logic to the existing ResumeSection and reused FeedbackPanel for displaying the results.

**Challenge 2:** Resume text could contain personal information, so users needed to confirm before sending it to an AI service.

**Resolution:** Added the required confirmation message and ensured the API request only runs after the user accepts.

**Challenge 3:** Users could attempt other resume actions while a feedback request was still processing.

**Resolution:** Added loading-state checks and disabled conflicting buttons during feedback generation.

**Challenge 4:** Feedback errors needed to display useful messages instead of leaving the page in a loading state.

**Resolution:** Used the existing API error-handling helper and displayed backend error messages through FeedbackPanel. Added tests for 422 and 503 errors.

**Challenge 5:** The live AI feedback endpoint was not available for final integration verification during frontend development.

**Resolution:** Used mocked API responses to test successful feedback, error messages, confirmation, and loading states. Final live integration testing remains pending.

### GitHub References

**Repository:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-  
**GitHub Issue:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-/issues/167  
**KR-11 Pull Request:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/201  
**Branch:** feature/KR-11-ai-feedback-button  
**Commit:** 3ea7141  
**Pull Request Status:** Open, awaiting review from Sayf and Dany. Both CI checks passed.  
**Backend Dependency:** LA-10 - AI Resume Feedback Endpoint.

### AI Assistance

Used ChatGPT for step-by-step implementation guidance, authenticated API integration, privacy confirmation handling, React state management, FeedbackPanel integration, unit test creation, error handling, and Git workflow instructions.

I reviewed the changes and verified them through 82 passing frontend tests, ESLint, the production build, Git whitespace validation, and GitHub CI. The frontend implementation is ready for review, with final live feedback testing pending backend integration.
