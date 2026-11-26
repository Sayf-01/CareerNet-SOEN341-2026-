# Static Analysis Report, Sprint 4

- **Tool:** SonarCloud (SonarQube Cloud), run in CI by GitHub Actions (`SonarSource/sonarqube-scan-action` v8, secretless login)
- **Setup tasks:** SA-21 (coverage in CI), SA-22 (SonarCloud in CI), SA-23 (this report)
- **First scan on `main`:** Fri Nov 20 2026
- **Dashboard:** https://sonarcloud.io/project/overview?id=Sayf-01_CareerNet-SOEN341-2026
- **Issues list:** https://sonarcloud.io/project/issues?id=Sayf-01_CareerNet-SOEN341-2026 (each row below names the file and line; open the list and filter by file to find the issue)

## First scan totals

| Measure | Result |
|---|---|
| Quality gate | Passed |
| Open issues | 11 (4 security, 7 reliability; 2 of these also carry a low maintainability impact) |
| Security rating | D (1 high, 3 medium) |
| Reliability rating | C (7 medium) |
| Maintainability rating | A |
| Security hotspots | 0 (rating A) |
| Duplication | 0.4% |
| Coverage | 66.9% (backend 97% and frontend 47% when measured alone) |

Coverage excludes tests, database migrations, scripts and config files, so it measures product code only.

## Issues

Each issue is found in SonarCloud by its file and line (see the Issues list link above). The GitHub issue number is in the Status column.

| # | File | Line | Issue | Type | Severity | Owner | Status | Fix commit |
|---|---|---|---|---|---|---|---|---|
| 1 | `App/routers/application_stats.py` | 67 | Unchecked input for loop condition via URL query parameter in `my_activity()` | Security | High | Lamees | False positive (marked in SonarCloud on Nov 21 with reason: "Not exploitable: `days` is limited to 7-90 by `Query(30, ge=7, le=90)`; out-of-range values return 400, covered by tests/test_application_stats.py"). GitHub issue #218 | |
| 2 | `.github/workflows/ci.yml` | 22 | `pip install` without `--only-binary :all:` can run setup scripts | Security | Medium | Sayf | Fixed and merged in PR #223 (GitHub issue #221) | `6dc5b4e` |
| 3 | `.github/workflows/ci.yml` | 22 | Dependencies installed without locking resolved versions | Security | Medium | Sayf | Accepted (marked in SonarCloud on Nov 21, reopen: never). Every direct dependency in `requirements.txt` is pinned with `==`; only indirect dependencies can change | |
| 4 | `.github/workflows/ci.yml` | 47 | `npm ci` without `--ignore-scripts` | Security | Medium | Sayf | Fixed and merged in PR #223 (GitHub issue #221) | `6dc5b4e` |
| 5 | `Documentation/Sprint 3/CareerNet_Sprint_3_Gantt.html` | 1 | Missing `<title>` in the page head | Reliability | Medium | Sayf | Fixed and merged in PR #223 | `30911d2` |
| 6 | `Documentation/Sprint 3/CareerNet_Sprint_3_Gantt.html` | 1 | Missing `lang` attribute on `<html>` | Reliability | Medium | Sayf | Fixed and merged in PR #223 | `30911d2` |
| 7 | `Documentation/Sprint 3/CareerNet_Sprint_3_Gantt.html` | 266 | Prefer `Number.parseFloat` over `parseFloat` | Reliability | Medium | Sayf | Fixed and merged in PR #223 | `30911d2` |
| 8 | `Documentation/Sprint 3/CareerNet_Sprint_3_Gantt.html` | 283 | Prefer `Number.parseFloat` over `parseFloat` | Reliability | Medium | Sayf | Fixed and merged in PR #223 | `30911d2` |
| 9 | `src/api/client.ts` | 33 | Regular expression (`.replace(/\/+$/, "")` strips trailing slashes) with super-linear backtracking | Reliability | Medium | Krish | Open (GitHub issue #219) | |
| 10 | `src/pages/RegisterPage.tsx` | 28 | Regular expression with super-linear backtracking (email check) | Reliability | Medium | Krish | Open (GitHub issue #219) | |
| 11 | `src/pages/LoginPage.tsx` | 41 | Regular expression with super-linear backtracking (email check) | Reliability | Medium | Dany | Open (GitHub issue #220) | |

## Notes

- **Owners** come from `git log` and `git blame` of the flagged line.
- **Issue 1 (false positive):** FastAPI rejects a `days` value outside 7 to 90 with a 400 before the loop runs, so the loop cannot be made large. SonarCloud does not recognize this check. Reason to write in SonarCloud when marking it: "Bounded by Query(ge=7, le=90) validation."
- **Issue 3 (accepted):** direct dependencies are pinned exactly. Fully locking indirect dependencies would need a lock file with hashes, which is more maintenance than the project needs for this sprint.
- **Issues 10 and 11 (email check):** the pattern `[^\s@]+\.[^\s@]+` lets the dot match in two places. The fix is to exclude the dot from the character class in those parts.
- **Issue 9 (`client.ts`):** a different pattern, `/\/+$/`, which removes trailing slashes. The fix is a simple loop that removes a trailing slash.
- **Pull requests that add new issues** show them in the SonarCloud check on the PR. The quality gate is not blocking merges this sprint.

## YO-13 verification, November 26, 2026

The live SonarCloud scan for `main` showed two open findings when checked
against upstream `main` at `c94a985`. Both belong to Krish under
[GitHub issue #219](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/issues/219).

| Report row | Current location | SonarCloud finding | Owner | Change in KR-13 |
|---|---|---|---|---|
| 9 | `frontend/src/api/client.ts:33` | [`typescript:S8786`](https://sonarcloud.io/project/issues?id=Sayf-01_CareerNet-SOEN341-2026&issues=AaH59YEazruU5Ed7ISME), open, Major severity, Medium reliability impact | Krish | Replaces the trailing-slash regex with string operations and adds a regression test for multiple trailing slashes. |
| 10 | `frontend/src/pages/RegisterPage.tsx:28` | [`typescript:S8786`](https://sonarcloud.io/project/issues?id=Sayf-01_CareerNet-SOEN341-2026&issues=AaH59YGTzruU5Ed7ISMG), open, Major severity, Medium reliability impact | Krish | Reuses the shared email validator already used by LoginPage. |

[KR-13 PR #243](https://github.com/Sayf-01/CareerNet-SOEN341-2026-/pull/243)
was open and unmerged at head `691923b`. Its
[SonarCloud Quality Gate](https://sonarcloud.io/dashboard?id=Sayf-01_CareerNet-SOEN341-2026&pullRequest=243)
returned `OK`, and GitHub reported successful backend, frontend, and SonarCloud
checks. Both findings remain open on `main` pending the merge and a new scan.
PR #243 covers both changes, so YO-13 records the verification and leaves the
production fixes with Krish. YO-11's matching fixes and YO-12's backend test
coverage work are separate.

SonarCloud already marks the LoginPage finding in row 11 as fixed. Its shared
validator landed on `main` in commit `cc125ad`. The original table above remains
the record of the first-scan findings and their owners.

After PR #243 merges, verify that the SonarCloud analysis on `main` covers the
merge commit or a descendant, that the `main` Quality Gate passes, and that both
linked findings are marked fixed. Record the analyzed commit and scan result in
this report. If either finding stays open, coordinate with Krish on the
remaining work.
