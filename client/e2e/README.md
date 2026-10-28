# End-to-end tests

These run the real Vite client, the real Express server and a real Postgres
database. Playwright starts the two servers for you; you supply the database.

This suite lives under `client/` (config: `client/playwright.config.ts`) even
though it also drives the server, since Playwright's dev-server orchestration
is naturally rooted at the app it opens a browser against.

## The database must be a throwaway

The suite creates and deletes users, pages and blocks. `global-setup.ts` refuses
to run unless all of these hold:

1. `TEST_DATABASE_URL` is set.
2. Its **database name contains `test`**. This is the fail-closed guard — the
   development Supabase database is named `postgres`, so it can never pass.
3. It differs from the `DATABASE_URL` in `server/.env`.

**Never point it at the development Supabase instance.**

## Local setup

With Postgres running locally:

```bash
createdb dmnotebook_test
export TEST_DATABASE_URL="postgresql://$USER@localhost:5432/dmnotebook_test"
npm run test:e2e   # from the repo root, or `npm run test:e2e` from client/
```

Or with Docker:

```bash
docker run --rm -d -p 55432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dmnotebook_test \
  --name dmnotebook-e2e-db postgres:16
export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:55432/dmnotebook_test"
npm run test:e2e
```

The first run needs browsers installed: `npx playwright install chromium`
(run from `client/`, or `npm --prefix client exec playwright install chromium`
from the root).

## What's covered

Only the load-bearing journeys — the unit suites in `client/` and `server/` cover
the details.

| Spec             | Journey                                                       |
| ---------------- | ------------------------------------------------------------- |
| `auth.spec.ts`   | Guest redirect, sign up, sign out, sign back in, bad password  |
| `pages.spec.ts`  | Create, rename, reopen, subpage navigation, delete             |
| `blocks.spec.ts` | Text block, to-do tick, block delete, code block language      |

## Notes

- `AI actions are not exercised end to end` — they would spend real Anthropic
  tokens and depend on model output. The streaming protocol is covered by unit
  tests on both sides (`server/test/handlers/ai.test.ts`, `client/test/api/ai.test.ts`).
- Each test registers its own account, so specs are independent and can run in
  parallel.
- Block and title saves are debounced by 500ms; tests wait on the resulting
  request rather than sleeping.

## Useful commands

Run these from `client/` (or via `npm run <script> --prefix client` /
the equivalent root-level script from the repo root):

```bash
npm run test:e2e              # headless
npm run test:e2e:ui           # Playwright UI mode
npx playwright test --debug   # step through
npx playwright show-report    # last HTML report
```
