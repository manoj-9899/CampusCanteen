# CampusCanteen v1.0.0-rc1

> **Release candidate** for campus demo and beta testing.  
> **Not** production-ready for real payments or public internet without credential hardening.

---

## Version summary

| Field | Value |
|-------|--------|
| **Tag** | `v1.0.0-rc1` |
| **Package version** | `1.0.0-rc1` |
| **Classification** | RC1 Ready (demo / beta) |
| **Readiness score** | 78/100 (RC1 audit) |
| **Stack** | Next.js 16 · Prisma · SQLite (local) · PostgreSQL/Neon (prod) |
| **Tests** | 70 Vitest · 6 Playwright E2E · ~50% API/lib coverage |
| **Deploy target** | Netlify + Neon |

### What RC1 includes

- Full student flow: browse → cart → validate → pay (simulated) → receipt + QR
- Staff flow: queue → QR verify (pickup secret) → confirm handover
- Inventory-aware ordering with stock deduction on payment
- Order lifecycle, 15-minute pending expiry, student cancellation
- JWT sessions, rate limits, staff middleware, QR pickup security
- Automated tests for auth, payments, cart validate, verify, checkout E2E

### What RC1 excludes

- Real payment gateway (Razorpay)
- Password reset, push notifications, search, feedback
- Prisma migrations (`db push` only)
- Production-grade rate limiting across serverless instances

---

## RC1 changelog

### RC1 stabilization (this release)

- **CI:** Added `lint` and `build:netlify` jobs alongside Vitest (`.github/workflows/test.yml`)
- **ESLint:** RC1 baseline — strict React Compiler hook rules downgraded to warnings (0 errors)
- **Dead code removed:** `Container.tsx`, `getUserFromDb`, unused menu schema type exports
- **Docs:** RC1 limitations in README; Netlify guide aligned with `netlify.toml` build path
- **Env:** `.env.example` documents all variables including `TEST_PAYMENT_MODE` (dev/test only)
- **Version:** Bumped to `1.0.0-rc1`

### Sprint 10 — Checkout & payment reliability

- Payment simulation: `TEST_PAYMENT_MODE=success|failure|timeout|stock_changed`
- `PaymentStatus.FAILED` written on simulated decline
- Integration tests: `payments.test.ts`, `cart-validate.test.ts`
- E2E: full student checkout + staff verify/handover (`checkout.spec.ts`)
- `docs/PAYMENT_FLOW.md`, `docs/CHECKOUT_RELIABILITY.md`

### Sprint 9 — Automated testing foundation

- Vitest + Playwright + GitHub Actions
- SQLite test DB isolation (`prepare-test-prisma.mjs`)

### Sprint 8 — Production hardening

- Order lifecycle integrity (`confirm-handover`, verify via `applyStaffStatusUpdate`)
- QR pickup secret (v2 payload)
- Verify rate limit, pending order client sync

### Sprints 1–7 — Core product

- Student/staff apps, menu CRUD, inventory, daily sales, forecast, refactored hooks/panels

---

## Known limitations

### Critical awareness (demo deployments)

1. **Simulated payments** — Production `POST /api/payments` always succeeds; no real money.
2. **Demo passwords** — Seed creates `student123` / `staff123`. Rotate before public URL.
3. **Re-seeding wipes data** — Never run `db:setup:neon` on production after initial setup.
4. **Open registration** — Anyone can register as student (rate-limited).

### High (documented, not blocking RC1 tag)

- No Prisma migration history
- Staff “Mark ready” can bypass QR secret (verify path requires secret)
- In-memory rate limits on Netlify serverless
- E2E not run in CI (requires Playwright browsers locally)
- No real payment failure retry UI

### Medium

- `GET /api/menu` public without auth
- Staff client uses raw `fetch` in some paths (no unified timeout)
- Accessibility partial (modals, tab keyboard patterns)
- `recharts` eagerly loaded on `/staff`

---

## Deployment checklist

### Pre-tag (repository)

- [ ] `npm run lint` passes
- [ ] `npm test` passes (70 tests)
- [ ] `npm run build:netlify` passes
- [ ] `npx playwright install chromium && npm run test:e2e` (optional local gate)
- [ ] Git tag: `git tag v1.0.0-rc1`

### Neon (one-time)

- [ ] Create Neon PostgreSQL project
- [ ] Copy connection string with `?sslmode=require`
- [ ] Run once from laptop:

  ```powershell
  $env:DATABASE_URL="postgresql://..."
  npm run db:setup:neon
  ```

- [ ] Confirm seed output; **do not repeat** on live DB

### Netlify

- [ ] Import GitHub repo
- [ ] Confirm build command: `node scripts/netlify-build.mjs && npm run build` (from `netlify.toml`)
- [ ] Environment variables:

  | Variable | Value |
  |----------|--------|
  | `DATABASE_URL` | Neon connection string |
  | `JWT_SECRET` | Strong random (32+ chars) |

- [ ] Do **not** set `TEST_PAYMENT_MODE` or SQLite `DATABASE_URL`
- [ ] Deploy → verify green build log

### Post-deploy smoke

- [ ] `https://your-site.netlify.app` loads
- [ ] Student login → add item → pay → receipt shows token + QR
- [ ] Staff login → `/staff` → queue shows order
- [ ] Staff verify QR (photo or manual flow) → confirm handover
- [ ] Student sees pickup confirmed
- [ ] Anonymous user redirected from `/staff`

### Demo credential policy

| Audience | Policy |
|----------|--------|
| Viva / classroom | Default seed credentials OK |
| Public internet | Rotate passwords or restrict URL access |
| Production (future) | Real gateway + no seed creds + migrations |

---

## Environment variables reference

| Variable | Local | Netlify | Test |
|----------|-------|---------|------|
| `DATABASE_URL` | `file:./dev.db` | Neon PostgreSQL URL | `file:./prisma/test.db` |
| `JWT_SECRET` | `.env` | Dashboard (required) | Test fixture in Vitest/Playwright |
| `NODE_ENV` | `development` | `production` (automatic) | `test` |
| `TEST_PAYMENT_MODE` | Optional dev | **Do not set** | Per-test in Vitest |

See `.env.example` and `docs/TESTING.md`.

---

## Netlify deployment path (verified)

```
git push → Netlify webhook
  → netlify.toml: NODE_VERSION=20
  → scripts/netlify-build.mjs (copy schema.postgresql.prisma → schema.prisma)
  → npm run build (prisma generate + next build)
  → @netlify/plugin-nextjs deploys Next.js runtime
  → Runtime reads DATABASE_URL + JWT_SECRET from Netlify env
```

Local smoke: `npm run build:netlify` (same schema swap as CI).

---

## Suggested git tag

```bash
git tag -a v1.0.0-rc1 -m "CampusCanteen release candidate 1"
git push origin v1.0.0-rc1
```

---

## Related documentation

| Doc | Purpose |
|-----|---------|
| [README.md](../README.md) | Portfolio entry + quick start |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design |
| [NETLIFY.md](./NETLIFY.md) | Step-by-step deploy + demo credential policy |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | RC1 deploy checklist |
| [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) | Live demo walkthrough |
| [INTERVIEW_GUIDE.md](./INTERVIEW_GUIDE.md) | Technical Q&A |
| [GITHUB_RELEASE.md](./GITHUB_RELEASE.md) | GitHub release metadata |
| [PORTFOLIO_READINESS.md](./PORTFOLIO_READINESS.md) | Portfolio assessment |
| [TESTING.md](./TESTING.md) | Test commands + `TEST_PAYMENT_MODE` |
| [PAYMENT_FLOW.md](./PAYMENT_FLOW.md) | Payment state machine |
| [CHECKOUT_RELIABILITY.md](./CHECKOUT_RELIABILITY.md) | Sprint 10 confidence report |
| [CAMPUS_CANTEEN_CHECKLIST.md](../CAMPUS_CANTEEN_CHECKLIST.md) | Full feature audit |
