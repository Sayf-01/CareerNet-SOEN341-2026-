# CareerNet | Sprint 4 Mid-Sprint Meeting

**Date:** 2026-11-19
**Time:** 5:40 pm to 6:30 pm
**Location / Platform:** Hall Building, room H418
**Minutes prepared by:** Kaila

## 1. Attendance

**Present:** Sayf, Krish, Kaila, Lamees, Youssef, Dany
**Absent:** none

## 2. Agenda

1. Demo preparation: what each person shows, and a practice run
2. Progress on the tracking points from the kickoff meeting
3. Running the latest code on everyone's laptop
4. Remaining Sprint 4 tasks and who is doing each one
5. Questions and blockers

## 3. Discussion

**1. Demo preparation:** We went over what each person will show in the demo, so everyone can explain their own features, their code and the decisions they made with AI. The main flows are: signing up and logging in, the job seeker profile and resume upload, searching and applying to jobs, the recruiter dashboard with postings and applicants, changing application status and setting interview dates, notifications, and AI resume feedback. We did a practice run and talked about the order of the demo so it flows from the job seeker side to the recruiter side.

**2. Progress since the kickoff:** We checked the tracking points from the last meeting:
- **Issues and labels:** new Sprint 4 work is created with an issue, labels and an assignee. For example, the candidate jobs and keyword score (KA-14) has issue #211 with the backend, P1 and sprint-4 labels, and its pull request #212 closed the issue automatically when it was merged on Nov 18.
- **Meeting minutes:** the minutes folder, README and template are being set up so this meeting and the kickoff are recorded in the same format.
- **Reviews:** pull requests are getting a reviewer who is not the author before merging.

**3. Running the latest code:** One member could not start the latest version of the app on their laptop. We troubleshot it together:
- The backend stopped at startup because a library added in Sprint 3 for reading Word resumes was not installed yet. Running `pip install -r requirements.txt` fixed it.
- The frontend would not start because some installed packages were broken and the installed Node version was not a supported one. We deleted `node_modules`, installed a supported Node version, and reinstalled the packages with `npm ci`, which installs exactly the versions in `package-lock.json`.
- After that both the backend and the frontend ran normally and the demo accounts worked.
We noted that after pulling main, everyone should run `pip install -r requirements.txt` and `npm ci` in case new packages were added.

**4. Remaining Sprint 4 tasks:** We went through what is left and who is doing it:
- **AI job matching:** the candidate jobs and keyword score are merged (KA-14). Next are the AI matching service (YO-11), the recommendations endpoint (LA-12) and the recommended jobs panel (DA-11).
- **Quality:** coverage and SonarCloud are being added to CI, then everyone writes tests for the gaps in their files and fixes the analysis issues found in them.
- **Reorganization:** the backend and frontend move into their own folders, then Kaila checks the backend and Dany checks the frontend.
- **Testing and demo:** acceptance test pass for all stories, end-to-end checks of the job seeker and recruiter stories, and the demo script and rehearsal.
- **Documents:** contribution logs, AI logs, personal reports and the Sprint 4 summary report.

**5. Questions and blockers:** The recommendations endpoint and panel depend on the AI matching service, so those owners will keep each other updated. The feature freeze is on Sat Nov 21, so features should be in pull requests before then.

## 4. Decisions

- Everyone runs the app on their own laptop from the latest main before the demo, so setup problems are found early.
- After pulling main, run `pip install -r requirements.txt` and `npm ci` before starting the app.
- The remaining Sprint 4 tasks keep the owners from the Sprint 4 plan.
- New features go in before the feature freeze on Sat Nov 21; after that only fixes, tests and documents are merged.

## 5. Action Items

| What | Who | By when | Issue / PR |
| --- | --- | --- | --- |
| Repository reorganization (SA-26) | Sayf | Nov 19 | PR #235 |
| Check the backend after the reorganization (KA-17) | Kaila | After SA-26 | #239 |
| Check the frontend after the reorganization (DA-15) | Dany | After SA-26 | — |
| Recommendations endpoint for AI job matching (LA-12) | Lamees | Nov 20 | PR #217 |
| Recommended jobs panel (DA-11) | Dany | Nov 20 | PR #224 |
| Backend tests for coverage gaps (KA-15, LA-13, YO-12) | Kaila, Lamees, Youssef | Nov 21 | #226, PR #227 (KA-15) |
| Frontend tests for coverage gaps (DA-12, KR-12) | Dany, Krish | Nov 21 | — |
| Acceptance test pass for all stories (SA-29) | Youssef | Nov 22 | — |
| Demo script and rehearsal (SA-30) | Krish | Nov 22 | — |
| Sprint 4 summary report (SA-31) | Lamees | Nov 23 | — |

A dash means the task had no GitHub issue or pull request to link when these minutes were written.

## 6. Next Meeting

**Date:** 2026-11-22 or 2026-11-23
**Focus:** Final check before submission: acceptance tests, demo rehearsal, logs and reports
