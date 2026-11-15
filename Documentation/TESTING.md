# Testing

## Running tests

Run the backend tests with:

```sh
pytest
```

Run the frontend unit tests with:

```sh
npm test
```

For frontend changes, also run the checks used by CI:

```sh
npm run lint
npm run build
```

## Where tests live

Backend tests are in the root `tests/` directory. Frontend tests live beside the
code they exercise as `*.test.ts` or `*.test.tsx`; shared Vitest setup is in
`src/test/setup.ts`.

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

## Pull requests

Every pull request must include tests for its changes. Keep tests isolated from
the real backend by mocking API modules or stubbing `fetch`.
