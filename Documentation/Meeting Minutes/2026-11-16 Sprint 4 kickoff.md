# CareerNet | Sprint 4 Kickoff

**Date:** 2026-11-16
**Time:** 5:40 pm to 6:30 pm
**Location / Platform:** Hall Building, room H806.01
**Minutes prepared by:** Kaila

## 1. Attendance

**Present:** Sayf, Krish, Kaila, Lamees, Youssef, Dany
**Absent:** none

## 2. Agenda

1. Wrap up the last Sprint 3 tasks before the Sprint 3 deadline (today)
2. Go over the TA's Sprint 3 feedback on team points and individual points
3. Agree on how we track our work on GitHub in Sprint 4
4. Walk through the Sprint 4 plan, the key dates and who owns each task
5. Questions and blockers

## 3. Discussion

**1. Sprint 3 wrap-up:** Today is the Sprint 3 deadline, so we went through the tasks that were still finishing. The last pieces of the AI resume feedback feature came together today: the AI feedback service (YO-10, #199), the feedback endpoint (LA-10, #203), the request limiter (KA-13, #173) and the "Get AI feedback" button (KR-11, #201), along with the interview status and date for recruiters (KR-9, #200). Sprint 3 contribution logs and AI logs were also being merged. Everyone confirmed their Sprint 3 work was either merged or in a pull request.

**2. TA feedback:** We read through the TA's feedback on the team points and the individual points. Our features and code were in good shape. The points we can still gain are mostly about showing our process clearly on GitHub, so we used the feedback to set the focus for Sprint 4.

**3. Tracking our work:** Three areas came out of the feedback:
- **Meeting minutes:** we were not keeping minutes in the repository after every meeting, and the TA wants more detail in them (who was there, what was decided, and who does what by when).
- **Closing issues:** some issues stayed open after their work was merged, because the pull request did not link the issue.
- **Labels:** some issues and pull requests were missing labels, which makes the board harder to follow.

We agreed on simple rules for each of these (see Decisions).

**4. Sprint 4 plan:** We went through the Sprint 4 goals:
- A second AI feature, **AI job matching**: the app recommends jobs to a job seeker based on their profile, with a keyword score as a backup when the AI is not available.
- **Quality work:** test coverage and SonarCloud static analysis in CI, unit tests for the gaps in coverage, and fixing the issues the analysis finds.
- **Repository reorganization:** the backend and frontend moved into their own folders.
- **Code reviews:** every pull request reviewed by someone other than the author, using a checklist.
- **Final documents:** meeting minutes, contribution logs, AI logs, personal reports, the summary report and the demo.

**Key dates we went over:**
- Tue Nov 17: coverage and the first static analysis report in CI
- Wed Nov 18 evening: the reorganization starts
- Thu Nov 19: reorganization merged, mid-sprint meeting
- Sat Nov 21: feature freeze (only fixes, tests and documents after this)
- Sun Nov 22: acceptance tests, demo rehearsal, logs
- Mon Nov 23: final repository check

**Who owns what:**
- **Sayf:** coverage and SonarCloud in CI, analysis report, repository reorganization, final repository check
- **Krish:** Sprint 4 milestone, board and labels, pull request template and review checklist, demo script, recruiter end-to-end check
- **Kaila:** candidate jobs and keyword score for AI job matching, meeting minutes setup and note taking, backend tests, code reviews
- **Lamees:** recommendations endpoint, backend tests, AI validation test run, Sprint 4 summary report
- **Youssef:** AI job matching service, backend tests, AI feature validation document, acceptance test pass
- **Dany:** recommended jobs panel, job matching acceptance test draft (AT-7), frontend tests and checks

**5. Questions and blockers:** The job matching work has an order: the candidate jobs and keyword score (KA-14) come first, then the AI matching service (YO-11), then the endpoint (LA-12) and the panel (DA-11). We agreed KA-14 should be done early so the others are not waiting.

## 4. Decisions

- Every meeting gets minutes in `Documentation/Meeting Minutes/`, written from a shared template and uploaded the same day. The note taker rotates, starting with Kaila.
- Minutes must include who attended, the agenda, what was discussed, decisions, and action items with an owner and a date.
- Every pull request links its issue with "Closes #<number>", so the issue closes by itself when the pull request is merged.
- Every issue and pull request gets labels (sprint, priority and area) and an assignee.
- Every pull request is reviewed by someone other than its author before it is merged.

## 5. Action Items

| What | Who | By when | Issue |
| --- | --- | --- | --- |
| Sprint 4 milestone, board and labels (SA-28) | Krish | Nov 16 | |
| Pull request template and review checklist (SA-25) | Krish | Nov 17 | |
| Test coverage in CI (SA-21) | Sayf | Nov 17 | |
| SonarCloud analysis in CI (SA-22) | Sayf | Nov 17 | |
| Meeting minutes folder, README and template (SA-27) | Kaila | Nov 18 | |
| Candidate jobs and keyword score for job matching (KA-14) | Kaila | Nov 18 | #211 |
| AI job matching service (YO-11) | Youssef | Nov 19 | |
| Job matching acceptance test draft (AT-7, DA-16) | Dany | Nov 17 | |

## 6. Next Meeting

**Date:** 2026-11-19
**Focus:** Mid-sprint check, demo preparation, progress on today's tracking rules
