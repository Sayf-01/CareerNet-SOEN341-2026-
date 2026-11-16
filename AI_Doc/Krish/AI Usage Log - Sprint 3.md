# CareerNet — Sprint 3 AI Usage Log

**Student:** Krish Patel\
**Course:** SOEN 341 — Software Process\
**Project:** CareerNet\
**Sprint:** 3 (November 4–16, 2026)\
**AI Tool:** ChatGPT

## KR-5 — Real API Integration Cleanup and Unit Testing

**Date:** November 5, 2026\
**Task:** KR-5 — Complete Real API Integration\
**Pull Requests:** #121, #129

### Purpose of AI Usage

I used ChatGPT to help review the Sprint 3 requirements, compare existing API implementations, identify unused mock data, correct TypeScript authentication types, and write frontend unit tests.

### Prompts and AI Assistance

#### Prompt 1 — Code Comparison

I asked ChatGPT to compare my real API integration with Kaila's fix/profile-resume-api branch and identify any missing functionality.

**AI Output:** ChatGPT compared the profile and resume API functions, including profile retrieval, file validation, FormData uploads, and authenticated downloads.

**My Decision:** I selected Path A because both implementations provided equivalent functionality. I kept the existing code without merging Kaila's branch.

#### Prompt 2 — Mock Data Cleanup

I asked ChatGPT to help identify unused mock-data files and outdated comments.

**AI Output:** ChatGPT provided Git commands to search for mock-data references and remove files that were no longer imported.

**My Modifications:** I removed src/mocks/jobs.ts and src/mocks/applications.ts and updated the outdated comment in JobsPage.tsx.

#### Prompt 3 — Authentication Type Correction

I asked ChatGPT to help align the frontend authentication response types with the FastAPI backend.

**AI Output:** ChatGPT suggested changing the user ID type from string to number and including full_name in the user response.

**My Modifications:** I updated src/types/auth.ts and corrected the optional mock-login response in src/services/authService.ts.

#### Prompt 4 — Frontend Unit Tests

I asked ChatGPT to help create unit tests for the real API integration using Vitest.

**AI Output:** ChatGPT generated four unit tests covering job search, missing-profile handling, profile saving, and retrieval of the logged-in user's applications.

**My Modifications:** I added src/api/integration.test.ts and ran the tests in my local development environment.

### Validation and Testing

I verified the changes by running:

- npm test — 5 tests passed.
- npm run lint — Passed.
- npm run build — Passed.
- git diff --cached --check — No whitespace errors.
- Git search commands — Confirmed no remaining mock-data imports or outdated mock API comments.
- GitHub Actions CI — Passed for PR #129.

### Final Decision

I reviewed and applied the AI-assisted suggestions, verified the resulting code through automated checks, and committed the changes on a separate feature branch.

The changes were reviewed through GitHub and merged into main.

**Commit:** 2eb7806\
**Final PR:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/129

---

## KR-6 — Recruiter Job Postings List

**Date:** November 5–7, 2026\
**Task:** KR-6 — Recruiter Postings List\
**Pull Request:** #134

### Purpose of AI Usage

I used ChatGPT to help implement the recruiter job postings list, create reusable React components, integrate frontend API functions, add validation and automated tests, troubleshoot browser errors, and verify the feature against the existing backend.

### Prompts and AI Assistance

#### Prompt 1 — Recruiter Postings List Implementation

I asked ChatGPT to guide me step by step through implementing the KR-6 recruiter postings list according to the Sprint 3 requirements.

**AI Output:** ChatGPT provided the RecruiterPosting interface, getMyJobs() API function, and a reusable postings table displaying job information, application counts, status, and Manage links.

**My Modifications:** I updated src/api/recruiter.ts and created PostingsTable.tsx. I also verified that the changes compiled successfully.

#### Prompt 2 — Reusable Posting Form and Dashboard Refactoring

I asked ChatGPT to help extract the existing job creation form into a reusable component and update the Recruiter Dashboard.

**AI Output:** ChatGPT generated a reusable PostingForm component with validation and suggested restructuring the dashboard to display postings, loading states, errors, and the job creation form.

**My Modifications:** I created PostingForm.tsx, refactored RecruiterDashboardPage.tsx, removed the duplicate job-category definition, and added automatic postings-list refresh after successful job creation.

#### Prompt 3 — Manage Posting Page and Routing Error

I asked ChatGPT to help implement the Manage Posting page and investigate why the page displayed a blank white screen.

**AI Output:** ChatGPT provided a recruiter-only route and management page, then helped interpret the browser Console error indicating that a Route component had been placed outside Routes.

**My Modifications:** I added RecruiterJobPage.tsx, corrected the route in App.tsx, and verified that the page displayed an existing job application correctly.

#### Prompt 4 — Frontend Unit Tests

I asked ChatGPT to help create unit tests for the recruiter postings table, form validation, and API functions.

**AI Output:** ChatGPT generated Vitest tests for displaying postings, handling empty states, validating required fields and categories, retrieving recruiter jobs, creating jobs, and handling API errors.

**My Modifications:** I created PostingsTable.test.tsx, postingValidation.ts, postingValidation.test.ts, and recruiter.test.ts.

I ran the tests locally and verified the results.

#### Prompt 5 — Dashboard Interaction Testing

I asked ChatGPT to help test whether creating a new job automatically refreshes the Recruiter Dashboard.

**AI Output:** ChatGPT recommended React Testing Library and jsdom and generated a component test that mocked API responses and simulated submitting a new job posting.

**My Modifications:** I installed the development dependencies and added RecruiterDashboardPage.test.tsx.

The test confirmed that the dashboard requested updated postings after creating a new job and displayed the newly created posting.

#### Prompt 6 — Real Backend Testing and Troubleshooting

I asked ChatGPT to help verify job creation in the real database and investigate the "Method Not Allowed" error displayed by the recruiter postings list.

**AI Output:** ChatGPT provided read-only SQL queries and guided me through checking FastAPI documentation to identify available backend endpoints.

**My Modifications:** I manually created a test job through the Recruiter Dashboard and verified that Job #34 was stored in PostgreSQL with recruiter ID 14 and status open.

I also confirmed that the running backend did not yet provide GET /api/v1/recruiter/jobs, identifying YO-4 as the remaining dependency.

#### Prompt 7 — Git Review and Pull Request Preparation

I asked ChatGPT to review the KR-6 changes, check Git formatting, guide me through committing and pushing the branch, and prepare the pull request description.

**AI Output:** ChatGPT provided Git commands, identified one formatting warning, suggested a commit message, and generated a PR description containing the implementation summary, testing results, and backend dependency.

**My Modifications:** I corrected the formatting issue, reviewed the staged changes, created commit a61887f, pushed the feature branch, and opened PR #134.

### Validation and Testing

I verified the changes by running:

- npm test — 17 tests passed across 6 test files.
- npm run lint — Passed.
- npm run build — Passed.
- git diff --cached --check — No whitespace errors.
- PostgreSQL SQL query — Confirmed Job #34 was saved successfully.
- Manual browser testing — Confirmed the Manage Posting page displayed an existing application.
- React Testing Library — Confirmed the mocked create-and-refresh workflow.
- FastAPI documentation — Confirmed the recruiter listings GET endpoint was missing from the running backend.
- GitHub Actions CI — All checks passed for PR #134.

### Final Decision

I reviewed and applied the AI-assisted suggestions, made the required changes in my local development environment, and verified the frontend through automated and manual testing.

I submitted the implementation through a separate feature branch and PR #134.

PR #134 was subsequently merged into main.

At the time of testing, live postings-list verification was pending YO-4 integration. No later live test is recorded in this log.

**Commit:** a61887f\
**Final PR:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/134\
**PR Status:** Merged into main.

---

## KR-7 - Recruiter Posting Edit and Archive UI

**Date:** November 9, 2026\
**Task:** KR-7 - Recruiter Posting Edit and Archive UI\
**Pull Request:** #174

### Purpose of AI Usage

I used ChatGPT to help implement the KR-7 recruiter posting editing and archiving feature, reuse the existing PostingForm component, add API functions, handle posting status changes, create automated tests, troubleshoot TypeScript errors, and prepare the acceptance test and pull request.

### Prompts and AI Assistance

#### Prompt 1 - KR-7 Implementation Planning

I asked ChatGPT to guide me step by step through implementing KR-7 according to the Sprint 3 requirements and existing project structure.

**AI Output:** ChatGPT reviewed the required frontend functionality, explained the dependency on KR-6 and YO-5, and provided Git commands for creating a new feature branch based on the KR-6 work.

**My Modifications:** I created feature/KR-7-edit-archive from the KR-6 branch and verified the working branch before making changes.

#### Prompt 2 - Recruiter Edit and Archive API Functions

I asked ChatGPT to help implement the API functions needed to update, archive, and unarchive recruiter job postings.

**AI Output:** ChatGPT generated the updateJob(), archiveJob(), and unarchiveJob() functions using the documented PATCH and POST endpoints. It also suggested updating the RecruiterJob status type.

**My Modifications:** I updated src/api/recruiter.ts and added tests to src/api/recruiter.test.ts to verify the API paths, request methods, and JSON request body.

#### Prompt 3 - Reusable Posting Form and Editing Functionality

I asked ChatGPT to help reuse the PostingForm from KR-6 for editing existing job postings.

**AI Output:** ChatGPT provided guidance for loading a job using getJob(), displaying the existing values in PostingForm, comparing submitted values with the original posting, and sending only changed fields to the update API.

**My Modifications:** I updated RecruiterJobPage.tsx to load posting details and support editing through the reusable form. I added success messages and handled cases where the user submitted the form without changing anything.

#### Prompt 4 - Archive and Unarchive Controls

I asked ChatGPT to help implement the archive and unarchive buttons, including the required confirmation message and handling of API errors.

**AI Output:** ChatGPT generated the archive confirmation logic, API calls, loading state, and success and error messages. It also explained how to change the available button based on whether the posting was open or archived.

**My Modifications:** I added the Archive and Unarchive controls to the management page, displayed the current posting status, and prevented repeated requests while the status was being updated.

#### Prompt 5 - Archived Job Application Restrictions

I asked ChatGPT to help ensure that archived postings could no longer receive new applications through the job detail page.

**AI Output:** ChatGPT suggested updating the job status type and checking whether job.status !== "open" when deciding whether the Apply button should be displayed.

**My Modifications:** I updated src/types/job.ts and JobDetailPage.tsx so that non-open jobs show "This job is closed." instead of the Apply option.

#### Prompt 6 - Component Testing and TypeScript Error Resolution

I asked ChatGPT to help write frontend tests for the new KR-7 functionality and troubleshoot an error found during the production build.

**AI Output:** ChatGPT generated component tests for existing form values, saving only changed fields, cancelling archive confirmation, archiving, unarchiving, API errors, and Apply-button visibility.

When the build reported a TypeScript error involving the mocked update response, ChatGPT identified the difference between the JobDetail and RecruiterJob status types and suggested using "open" as const in the test response.

**My Modifications:** I added RecruiterJobPage.test.tsx and JobDetailPage.test.tsx, updated the existing recruiter API tests, and corrected the TypeScript test data.

I reran all automated checks and confirmed that all 29 tests passed.

#### Prompt 7 - Acceptance Test Preparation

I asked ChatGPT to help prepare the AT-1 acceptance test for recruiter posting management based on the Sprint 3 requirements.

**AI Output:** ChatGPT provided manual test steps for viewing a recruiter's postings, editing a job, archiving it, checking application restrictions, and unarchiving it. It also identified the relevant automated tests and the remaining backend dependencies.

**My Modifications:** I updated GitHub issue #142 with the manual testing instructions, automated test references, and pending end-to-end testing status.

#### Prompt 8 - Final Code Review and Pull Request Preparation

I asked ChatGPT to review the staged KR-7 changes, check the implementation against the requirements, and guide me through the Git workflow.

**AI Output:** ChatGPT reviewed the API functions and Manage Posting page, suggested displaying the posting title and status together, provided commands for testing and staging the changes, and helped prepare the pull request description.

ChatGPT also checked the KR-6 dependency and recommended a stacked pull request to keep the KR-7 changes separate.

**My Modifications:** I updated the title and status display, verified all checks, reviewed the staged files, and created commit a17f684.

I pushed the feature branch and created PR #174 targeting feature/KR-6-postings-list. I requested reviews from Sayf and Dany.

### Validation and Testing

I verified the changes by running:

- npm test - 29 tests passed across 8 test files.
- npm run lint - Passed.
- npm run build - Passed.
- git diff --cached --check - No whitespace errors.
- React Testing Library - Verified editing, archiving, unarchiving, confirmation, and error-handling interactions using mocked API responses.
- Vitest API tests - Verified the new recruiter API functions and request structures.
- JobDetailPage tests - Confirmed that archived postings hide the Apply option.
- Git review - Confirmed that all seven KR-7 files were included in the commit.
- GitHub comparison - Confirmed that PR #174 contains one commit and seven changed files.
- GitHub CI - No checks reported for PR #174 at the time of verification.
- Live backend testing - Pending YO-5 integration.

### Final Decision

I reviewed the AI-assisted code suggestions and implemented the changes in my local development environment. I verified the frontend functionality using automated tests and checked the code with ESLint, TypeScript, and the production build.

I also corrected a TypeScript test error, reviewed the final Git changes, and prepared the AT-1 acceptance test draft.

The completed frontend implementation was committed and submitted through PR #174 for team review.

PR #174 was subsequently merged into main. Full live edit/archive integration was not verified in the recorded testing session.

**Commit:** a17f684\
**Final PR:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/174\
**PR Status:** Merged into main.\
**Backend Dependency:** YO-5 - Edit and Archive Posting Endpoints.

---

## KR-9 - Applicant Status, Interview Scheduling and Resume Viewing

**Date:** November 2026\
**Task:** KR-9 - Status Change, Interview Date and Resume View\
**GitHub Issue:** #149\
**Pull Request:** #200

### Purpose of AI Usage

I used ChatGPT to help implement the recruiter applicant management features, including changing application statuses, scheduling interviews, viewing applicant resumes, handling API errors, and writing automated tests. I also used it to review the code, fix issues, and prepare the GitHub pull request.

### Prompts and AI Assistance

#### Prompt 1 - KR-9 Implementation Planning

I asked ChatGPT to guide me step by step through KR-9 using the Sprint 3 personal guide and the existing applicant management components.

**AI Output:** ChatGPT explained the required API functions, how the status dropdown and interview date should work, and how to add the new functionality without breaking Dany's existing ApplicantsPanel.

**My Modifications:** I reviewed the existing recruiter API and applicant components, created the feature/KR-9-status-interview branch, and organized the changes into a separate ApplicantRow component so each applicant could be managed individually.

#### Prompt 2 - Application Status and Interview Scheduling

I asked ChatGPT to help implement the status dropdown, Save button, and interview date and time field.

**AI Output:** ChatGPT suggested adding an updateApplicationStatus() API function, showing the interview date field only when Interview was selected, and converting the selected local date and time into ISO format before sending it to the backend.

**My Modifications:** I updated src/api/recruiter.ts and created ApplicantRow.tsx. I added the five application statuses, interview date input, Save button, loading state, and success and error messages. I also ensured that the interview date was only included in the API request when the selected status was Interview.

#### Prompt 3 - Applicant Resume Viewing

I asked ChatGPT to help implement the optional View Resume feature for recruiters.

**AI Output:** ChatGPT explained how to retrieve the resume using the authenticated API client, handle the returned file as a Blob, and open it in a new browser tab. It also suggested showing an appropriate message when a resume was unavailable.

**My Modifications:** I added the resume download function to src/api/recruiter.ts and connected it to a View Resume button in ApplicantRow.tsx. I included error handling for unavailable resumes and used the authenticated request instead of a direct file URL.

#### Prompt 4 - Automated Testing

I asked ChatGPT to help write unit tests for status changes, interview scheduling, resume viewing, and API error handling.

**AI Output:** ChatGPT provided Vitest and React Testing Library test examples using mocked recruiter API functions. The tests covered selecting Interview, entering a date, converting it to ISO format, saving another status without an interview date, handling failed requests, and viewing a resume.

**My Modifications:** I created ApplicantRow.test.tsx and updated recruiter.test.ts. I reviewed the expected API requests and adjusted the test data to match the existing application types and components.

#### Prompt 5 - Final Review and Pull Request Preparation

I asked ChatGPT to review the KR-9 implementation, confirm that the tests and build passed, and guide me through the Git workflow.

**AI Output:** ChatGPT provided commands to run tests, ESLint, the production build, and Git formatting checks. It also helped prepare the commit message and pull request description.

**My Modifications:** I reviewed the changes, ran the validation commands, created commit 0a83488, pushed the feature branch, and opened PR #200. I requested reviews from Sayf and Dany.

### Validation and Testing

I verified the changes by running:

- npm test - 87 tests passed across 20 test files.
- npm run lint - Passed.
- npm run build - Passed.
- Git whitespace validation - Passed.
- Applicant component tests - 11 tests passed.
- Recruiter API tests - 4 new tests passed.
- React Testing Library - Verified status changes, interview date handling, error messages, and resume viewing with mocked API responses.
- GitHub Actions CI - Both checks passed for PR #200.
- Live backend integration - Still requires final verification.

### Final Decision

I reviewed the AI-assisted suggestions and implemented the required changes in the existing frontend structure. I verified the status update and interview scheduling logic through automated tests and confirmed that the application compiled successfully.

I also completed the optional resume viewing feature and included error handling. The code was committed and submitted through PR #200 for team review. Final testing with the live backend is still needed.

**Commit:** 0a83488\
**Final PR:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/200\
**PR Status:** Open, awaiting team review. Both CI checks passed.\
**Backend Integration:** Final live testing pending.

---

## KR-11 - AI Resume Feedback Button

**Date:** November 16, 2026\
**Task:** KR-11 - Get AI Feedback Button on Resume List\
**GitHub Issue:** #167\
**Pull Request:** #201

### Purpose of AI Usage

I used ChatGPT to help implement the AI feedback button for uploaded resumes, connect it to the feedback API, display the results using the existing FeedbackPanel component, handle loading and error states, and create automated tests. I also used it to review the final changes and prepare the GitHub pull request.

### Prompts and AI Assistance

#### Prompt 1 - KR-11 Implementation Planning

I asked ChatGPT to guide me through KR-11 according to the Sprint 3 requirements and the existing resume management code.

**AI Output:** ChatGPT explained how to connect the existing ResumeSection with Dany's FeedbackPanel and the backend feedback endpoint. It suggested keeping the changes inside the existing resume components and using mocked API responses for testing.

**My Modifications:** I created feature/KR-11-ai-feedback-button, reviewed ResumeSection.tsx, FeedbackPanel.tsx, and the resume API functions, and planned the new functionality without changing the existing resume upload and download features.

#### Prompt 2 - AI Feedback API Integration

I asked ChatGPT to help add the frontend API function for requesting feedback on a selected resume.

**AI Output:** ChatGPT suggested implementing getResumeFeedback(id) in src/api/resumes.ts using the existing authenticated API client. The function sends a POST request to /resumes/{id}/feedback and returns a ResumeFeedback object.

**My Modifications:** I added the API function, imported the existing feedback type, and used the same API request structure as the other resume functions.

#### Prompt 3 - Confirmation Dialog and Feedback Display

I asked ChatGPT to help implement the Get AI feedback button, privacy confirmation message, loading state, and feedback display.

**AI Output:** ChatGPT suggested using window.confirm() before making the API request, keeping feedback in React component state, and displaying the result through the existing FeedbackPanel. It also explained how to show feedback for only one resume at a time.

**My Modifications:** I updated ResumeSection.tsx to add a Get AI feedback button beside each resume. I implemented the required privacy confirmation message, loading state, success response, and error handling. I also ensured that cancelling the confirmation does not call the API.

#### Prompt 4 - Loading State and Error Handling

I asked ChatGPT to help prevent repeated requests while feedback was being generated and display backend errors correctly.

**AI Output:** ChatGPT suggested disabling conflicting resume actions during loading and using the existing error-handling helper to display backend messages. It also explained how to handle errors such as 422 and 503.

**My Modifications:** I disabled resume actions while the feedback request was processing and added error handling through FeedbackPanel. During the final review, I also updated the Upload Resume button so it was disabled while feedback was loading.

#### Prompt 5 - Automated Testing

I asked ChatGPT to help create unit tests for the confirmation dialog, API requests, feedback display, errors, and loading state.

**AI Output:** ChatGPT provided examples using Vitest, React Testing Library, mocked API functions, and a mocked window.confirm().

**My Modifications:** I created ResumeSection.test.tsx with seven component tests and resumes.feedback.test.ts with three API tests. I verified confirmation cancellation, successful responses, displaying feedback for one resume at a time, 422 and 503 errors, and disabled controls during loading.

#### Prompt 6 - Final Review and GitHub Submission

I asked ChatGPT to review the completed implementation and guide me through the final checks, commit, and pull request.

**AI Output:** ChatGPT provided commands for running all frontend tests, ESLint, the production build, and Git whitespace validation. It also helped prepare the commit message and pull request description.

**My Modifications:** I reviewed the four changed files, completed the final loading-state adjustment, reran all checks, and committed the changes as 3ea7141. I pushed the feature branch and created PR #201.

### Validation and Testing

I verified the changes by running:

- npm test - 82 tests passed across 21 test files.
- npm run lint - Passed.
- npm run build - Passed.
- Git whitespace validation - Passed.
- ResumeSection component tests - 7 tests passed.
- Resume feedback API tests - 3 tests passed.
- Confirmation dialog - Verified using a mocked browser confirmation.
- Feedback display - Verified using mocked API responses.
- Error handling - Verified 422 and 503 responses.
- Loading state - Verified that conflicting resume actions were disabled.
- GitHub Actions CI - Both checks passed for PR #201.
- Live feedback endpoint - Final integration testing pending.

### Final Decision

I reviewed the AI-assisted code and made the required changes in my local development environment. The feature allows users to request AI feedback for an uploaded resume after confirming the privacy notice. The frontend displays the result without permanently storing the feedback.

I verified the functionality through automated tests and confirmed that ESLint and the production build passed. I submitted the changes through PR #201 for team review. Live testing with the actual AI feedback endpoint is still required.

**Commit:** 3ea7141\
**Final PR:** https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/201\
**PR Status:** Open, awaiting team review. Both CI checks passed.\
**Backend Dependency:** LA-10 - AI Resume Feedback Endpoint, final integration testing pending.
