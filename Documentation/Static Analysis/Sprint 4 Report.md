# Static Analysis Report, Sprint 4

- **Tool:** SonarCloud (SonarQube Cloud), run in CI by GitHub Actions (`SonarSource/sonarqube-scan-action` v8, secretless login)
- **Setup tasks:** SA-21 (coverage in CI), SA-22 (SonarCloud in CI), SA-23 (this report)
- **First scan on `main`:** Fri Nov 20 2026
- **Dashboard:** https://sonarcloud.io/project/overview?id=Sayf-01_CareerNet-SOEN341-2026

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

Add the SonarCloud link of each issue in the last column before submitting (open the issue, copy the address).

| # | File | Line | Issue | Type | Severity | Owner | Status | Fix commit | Sonar link |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `App/routers/application_stats.py` | 67 | Unchecked input for loop condition via URL query parameter in `my_activity()` | Security | High | Lamees | Open. Likely false positive: `days` is limited to 7 to 90 by `Query(30, ge=7, le=90)`; to be confirmed by Lamees (GitHub issue #218) | | |
| 2 | `.github/workflows/ci.yml` | 22 | `pip install` without `--only-binary :all:` can run setup scripts | Security | Medium | Sayf | Fixed in branch `fix/SA-23-analysis-ci-and-gantt` (GitHub issue #221) | `6dc5b4e` | |
| 3 | `.github/workflows/ci.yml` | 22 | Dependencies installed without locking resolved versions | Security | Medium | Sayf | Proposed: Accepted. Every direct dependency in `requirements.txt` is pinned with `==`; only indirect dependencies can change | | |
| 4 | `.github/workflows/ci.yml` | 47 | `npm ci` without `--ignore-scripts` | Security | Medium | Sayf | Fixed in branch `fix/SA-23-analysis-ci-and-gantt` (GitHub issue #221) | `6dc5b4e` | |
| 5 | `Documentation/Sprint 3/CareerNet_Sprint_3_Gantt.html` | 1 | Missing `<title>` in the page head | Reliability | Medium | Sayf | Fixed in the same branch | `30911d2` | |
| 6 | `Documentation/Sprint 3/CareerNet_Sprint_3_Gantt.html` | 1 | Missing `lang` attribute on `<html>` | Reliability | Medium | Sayf | Fixed in the same branch | `30911d2` | |
| 7 | `Documentation/Sprint 3/CareerNet_Sprint_3_Gantt.html` | 266 | Prefer `Number.parseFloat` over `parseFloat` | Reliability | Medium | Sayf | Fixed in the same branch | `30911d2` | |
| 8 | `Documentation/Sprint 3/CareerNet_Sprint_3_Gantt.html` | 283 | Prefer `Number.parseFloat` over `parseFloat` | Reliability | Medium | Sayf | Fixed in the same branch | `30911d2` | |
| 9 | `src/api/client.ts` | 33 | Regular expression (`.replace(/\/+$/, "")` strips trailing slashes) with super-linear backtracking | Reliability | Medium | Krish | Open (GitHub issue #219) | | |
| 10 | `src/pages/RegisterPage.tsx` | 28 | Regular expression with super-linear backtracking (email check) | Reliability | Medium | Krish | Open (GitHub issue #219) | | |
| 11 | `src/pages/LoginPage.tsx` | 41 | Regular expression with super-linear backtracking (email check) | Reliability | Medium | Dany | Open (GitHub issue #220) | | |

## Notes

- **Owners** come from `git log` and `git blame` of the flagged line.
- **Issue 1 (false positive):** FastAPI rejects a `days` value outside 7 to 90 with a 400 before the loop runs, so the loop cannot be made large. SonarCloud does not recognize this check. Reason to write in SonarCloud when marking it: "Bounded by Query(ge=7, le=90) validation."
- **Issue 3 (accepted):** direct dependencies are pinned exactly. Fully locking indirect dependencies would need a lock file with hashes, which is more maintenance than the project needs for this sprint.
- **Issues 10 and 11 (email check):** the pattern `[^\s@]+\.[^\s@]+` lets the dot match in two places. The fix is to exclude the dot from the character class in those parts.
- **Issue 9 (`client.ts`):** a different pattern, `/\/+$/`, which removes trailing slashes. The fix is a simple loop that removes a trailing slash.
- **Pull requests that add new issues** show them in the SonarCloud check on the PR. The quality gate is not blocking merges this sprint.
