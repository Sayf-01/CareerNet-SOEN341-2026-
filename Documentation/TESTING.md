# Testing

## Running tests

Run the backend tests from `backend/` with:

```sh
pytest
```

Run the frontend unit tests from `frontend/` with:

```sh
npm test
```

For frontend changes, also run the checks used by CI:

```sh
npm run lint
npm run build
```

## Where tests live

Backend tests are in the `backend/tests/` directory. Frontend tests live beside the
code they exercise as `*.test.ts` or `*.test.tsx`; shared Vitest setup is in
`frontend/src/test/setup.ts`.

## Testing components that call the API

Do not call the real backend from a component test. Mock the API module and
provide a resolved response, for example:

```tsx
import { vi } from 'vitest'
import { getApplicationsForJob } from '../api/recruiter'

vi.mock('../api/recruiter')

vi.mocked(getApplicationsForJob).mockResolvedValue([])
```

Put the mock in the component test before rendering the component. The
`RecruiterDashboardPage` also uses `createJob` from the same API module; mock
that function too when the test exercises job creation. Wrap pages that use
application context in the same provider used by the app.

## What is tested

Every source file with logic has tests. Files that only hold types (`frontend/src/types/`)
need none.

| Area | Where | What the tests check |
|---|---|---|
| Backend API | `backend/tests/test_*.py` | Every endpoint: success, wrong input (400/422), missing login (401), wrong role (403), not found (404) |
| Backend services | `test_ai_feedback.py`, `test_ai_matching.py`, `test_edge_cases_sprint4.py` | AI answers that are valid, empty, malformed or unavailable; fake mode; database URL fix-up; the 500 handler |
| Frontend pages | `frontend/src/pages/*.test.tsx` | Loading, empty, error and success states; form checks; redirects; paging and filters |
| Frontend components | `frontend/src/components/*.test.tsx` | Buttons, dialogs, uploads, status badges, notifications |
| Frontend API helpers | `frontend/src/api/*.test.ts` | Request paths and bodies, the login token header, error messages, 404 handling |
| Login and routing | `context/AuthContext.test.tsx`, `services/authService.test.ts`, `App.test.tsx` | Saved login, logout, protected pages, recruiter-only pages |

## Writing a new test

Follow the pattern of the file next to yours:

- Test what the user sees (`screen.getByRole`, `getByLabelText`), not internal state.
- Mock the API module, never the real backend. Use `mockResolvedValue` for success and
  `mockRejectedValue` for failure, and test both.
- `<dialog>` is not implemented in jsdom. Tests that open one add small `showModal` and
  `close` versions in `beforeAll` (see `components/ApplyDialog.test.tsx`).
- Do not write `beforeEach(() => mock.mockReset())` on one line. The arrow function returns
  the mock, which Vitest then calls after the test. Use braces.
- Backend tests use an in-memory SQLite database from `tests/conftest.py`. Never point a test
  at the shared database.
- Each pull request needs tests for the lines it changes. SonarCloud checks that at least 80%
  of the changed lines are covered.

## Test coverage

CI runs both test suites with coverage on every pull request and every push to
`main`, and shows a summary on the run page. The full reports are attached to
the run as the `backend-coverage` and `frontend-coverage` artifacts.

Run the same commands locally (backend from `backend/`, frontend from `frontend/`):

```sh
pytest --cov --cov-report=term-missing       # backend: lines not tested are listed
npm run test:coverage                        # frontend: table per file
```

Backend coverage covers `backend/App/`. Frontend coverage covers `frontend/src/`,
without test files and `src/main.tsx`. Use the "Missing" lines (backend) and the
per-file table (frontend) to find gaps and write tests for them.

### YO-12 backend coverage

The baseline was upstream `main` at `c94a985`, before the YO-12 test changes.
The baseline had **338 passing tests** and the final run had **347 passing
tests**. Both runs collected branch coverage in addition to line coverage.
Run from `backend/` in a POSIX shell:

```sh
AI_FEEDBACK_MODE=fake AI_MATCHING_MODE=fake AI_API_KEY='' PYTHON_DOTENV_DISABLED=1 \
  python -m pytest -q --cov --cov-branch --cov-report=term-missing
```

| File | Baseline line | Final line | Baseline branch | Final branch |
|---|---:|---:|---:|---:|
| `App/routers/recruiter.py` | 100% (78/78) | 100% (78/78) | 100% (22/22) | 100% (22/22) |
| `App/schemas/recruiter.py` | 100% (37/37) | 100% (37/37) | 100% (6/6) | 100% (6/6) |
| `App/services/ai_feedback.py` | 100% (77/77) | 100% (77/77) | 100% (32/32) | 100% (32/32) |
| `App/services/ai_matching.py` | 100% (78/78) | 100% (78/78) | 100% (14/14) | 100% (14/14) |
| All measured backend code | 100% (1190/1190) | 100% (1190/1190) | 98.74% (235/238) | 98.74% (235/238) |

The target files already exceeded the 80% goal. The new tests check applicant
access and privacy, the UTC end-date boundary, isolation between fake feedback
results, and safe handling of malformed provider responses. The recommendations
fallback test now exercises the matching service with a mocked provider reply.
The three uncovered backend branch paths are in `App/crud/jobs.py` (24→28) and
`App/routers/application_stats.py` (33→32 and 61→63).

## Code analysis (SonarCloud)

After the tests, CI sends the code and both coverage reports to SonarCloud, which
lists bugs, vulnerabilities, security hotspots, code smells and duplication.
Settings live in `sonar-project.properties`. Login is secretless (GitHub OIDC),
so there is no token to store. Pull requests from forks skip this step.

## Pull requests

Every pull request must include tests for its changes. Keep tests isolated from
the real backend by mocking API modules or stubbing `fetch`.

## Lines not covered by tests

Only defensive checks that the interface cannot reach are left untested:

- `frontend/src/components/ApplicantRow.tsx` (invalid interview date): the browser's date picker never returns an unreadable date.
- `frontend/src/pages/RecruiterJobPage.tsx` ("Posting is not loaded" and the double-click guard on archive): the form and the archive button are not shown until the posting is loaded.

The YO-12 table above records backend line and branch coverage separately.
