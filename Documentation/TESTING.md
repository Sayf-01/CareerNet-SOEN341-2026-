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

## Code analysis (SonarCloud)

After the tests, CI sends the code and both coverage reports to SonarCloud, which
lists bugs, vulnerabilities, security hotspots, code smells and duplication.
Settings live in `sonar-project.properties`. Login is secretless (GitHub OIDC),
so there is no token to store. Pull requests from forks skip this step.

## Pull requests

Every pull request must include tests for its changes. Keep tests isolated from
the real backend by mocking API modules or stubbing `fetch`.

## Lines not covered by tests

- `App/database/connection.py` line 14: changes a `postgres://` address to `postgresql://`. It only runs when the app starts with a real cloud database address, and tests always start with SQLite, so it can't run in the test suite.
