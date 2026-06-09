# CampusCanteen Testing Guide (Sprint 9)

## Stack

| Layer | Tool | Purpose |
| ----- | ---- | ------- |
| Unit + integration | **Vitest** | Pure lib tests + API route handlers with mocked `next/headers` |
| E2E | **Playwright** | Browser flows against running Next.js dev server |
| Database | **SQLite `prisma/test.db`** | Isolated from dev `dev.db` |
| Seed | `tests/setup/db.ts` + `prisma/seed.ts` | Deterministic fixtures |

## Architecture

```
tests/
  setup/
    vitest.setup.ts      # env, db push, cookie mock reset
    db.ts                # test DB + minimal seed
    mocks/next-headers.ts # mock next/headers cookies for API routes
  helpers/
    auth.ts              # login/register/session cookie helpers
    request.ts           # NextRequest builders
    orders.ts            # factory helpers for orders
  unit/                  # pure lib + DB-backed unit tests
  integration/           # API route handler tests
  e2e/                   # Playwright browser tests
```

**Determinism rules:**
- No `setTimeout` assertions in tests
- Rate limit store reset in `afterEach`
- Unique IPs/emails where limits apply
- `beforeEach` re-seeds SQLite for isolation

**Schema note:** Tests always use SQLite (`prisma/test.db`) via `scripts/prepare-test-prisma.mjs`, which builds a temporary schema from `schema.postgresql.prisma`. This works even if your local `schema.prisma` is set to PostgreSQL after `npm run db:push:neon`. `restore-dev-prisma.mjs` runs after tests to regenerate your dev client.

## Commands

```bash
# All Vitest tests (unit + integration)
npm test

# Watch mode
npm run test:watch

# Unit only
npm run test:unit

# Integration only
npm run test:integration

# Coverage (lib + API routes)
npm run test:coverage

# E2E (starts dev server with test.db)
npm run test:e2e

# Full suite
npm run test:all

# Prepare test database manually
npm run test:db:setup
```

## CI

GitHub Actions workflow `.github/workflows/test.yml` runs Vitest on push/PR.

## Environment

Vitest sets automatically:

- `DATABASE_URL=file:./prisma/test.db`
- `JWT_SECRET=test-jwt-secret-vitest`

E2E uses the same test DB via `playwright.config.ts` `webServer.env`.

### Payment simulation (Sprint 10)

Development and test only (`NODE_ENV !== "production"`):

```bash
TEST_PAYMENT_MODE=success        # default
TEST_PAYMENT_MODE=failure        # 402, paymentStatus FAILED
TEST_PAYMENT_MODE=timeout        # 408, order unchanged
TEST_PAYMENT_MODE=stock_changed  # 409 after pre-check passes
```

Vitest sets modes per test via `process.env.TEST_PAYMENT_MODE`.  
Playwright `webServer.env` sets `TEST_PAYMENT_MODE=success` for checkout E2E.

See [`PAYMENT_FLOW.md`](./PAYMENT_FLOW.md).

## Manual QA checklist

After schema changes:

```bash
npm run test:db:setup
npm test
npm run test:e2e
```
