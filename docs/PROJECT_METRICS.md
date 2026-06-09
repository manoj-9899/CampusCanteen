# CampusCanteen Project Metrics

> Counts from codebase at **`v1.0.0-rc1`** (2026-06-07). Re-run after major changes.

---

## Summary

| Metric | Count |
|--------|------:|
| API route files | 16 |
| HTTP handlers | 22 |
| Prisma models | 4 |
| Prisma enums | 3 (`Role`, `OrderStatus`, `PaymentStatus`) |
| React components (`.tsx`) | 59 |
| Custom hooks | 5 |
| Library modules (`src/lib`) | 24 |
| Vitest test files | 13 |
| Vitest tests | 70 |
| Playwright E2E specs | 3 |
| Playwright E2E tests | 6 |
| Documentation files (`docs/`) | 17 |
| Sprints completed | 10 + RC1 stabilization |

---

## API routes

| Route | Methods |
|-------|---------|
| `/api/auth` | POST |
| `/api/auth/session` | GET, DELETE |
| `/api/menu` | GET, POST |
| `/api/menu/[id]` | PATCH, DELETE |
| `/api/cart/validate` | POST |
| `/api/orders` | GET, POST |
| `/api/orders/[id]` | GET, PATCH |
| `/api/orders/[id]/cancel` | POST |
| `/api/orders/[id]/confirm-handover` | POST |
| `/api/orders/[id]/qr` | GET |
| `/api/orders/queue` | GET |
| `/api/orders/verify` | POST |
| `/api/payments` | POST |
| `/api/inventory` | GET, PATCH |
| `/api/analytics/daily` | GET |
| `/api/forecast` | GET |

---

## Prisma schema

| Model | Key fields |
|-------|------------|
| `User` | email, role, studentId |
| `MenuItem` | stockQuantity, isAvailable, isDailySpecial |
| `Order` | status, paymentStatus, pickupSecret, tokenNumber |
| `OrderItem` | quantity, unitPrice (price snapshot) |

---

## Frontend structure

| Area | Components (approx.) |
|------|---------------------:|
| Student UI | 22 |
| Staff UI | 18 |
| Shared / layout | 12 |
| UI primitives (`ui/`) | 7 |

### Custom hooks

| Hook | Purpose |
|------|---------|
| `useStudentApp` | Student checkout orchestration |
| `useStaffApp` | Staff tabs, queue, verify, inventory |
| `useVisibilityPolling` | Battery-friendly polling |
| `useNetworkStatus` | Offline detection |
| `usePwaInstall` | PWA install prompt |

---

## Testing

| Suite | Files | Tests |
|-------|------:|------:|
| Unit | 6 | 28 |
| Integration | 7 | 42 |
| E2E | 3 | 6 |
| **Total** | **16** | **76** *(70 Vitest + 6 Playwright)* |

### Coverage (`src/lib` + `src/app/api`)

| Metric | % |
|--------|--:|
| Lines | **50.13** |
| Statements | 49.02 |
| Functions | 55.97 |
| Branches | 38.85 |

**Well-covered routes:** `cart/validate` (100%), `payments` (80%), `auth` (~88% lib), `inventory` lib (100%).

---

## Documentation

| File | Topic |
|------|-------|
| `README.md` | Portfolio entry |
| `CAMPUS_CANTEEN_CHECKLIST.md` | Feature audit |
| `docs/ARCHITECTURE.md` | System design |
| `docs/RC1_RELEASE.md` | Release notes |
| `docs/NETLIFY.md` | Deploy guide |
| `docs/DEPLOYMENT_CHECKLIST.md` | Deploy checklist |
| `docs/ORDER_LIFECYCLE.md` | Status rules |
| `docs/QR_PICKUP_SECURITY.md` | QR security |
| `docs/PAYMENT_FLOW.md` | Payments |
| `docs/CHECKOUT_RELIABILITY.md` | Test confidence |
| `docs/TESTING.md` | Test guide |
| `docs/MOBILE_AUDIT.md` | Mobile/PWA |
| `docs/INTERVIEW_GUIDE.md` | Interview prep |
| `docs/RESUME_BULLETS.md` | Resume content |
| `docs/DEMO_SCRIPT.md` | Live demo script |
| `docs/GITHUB_RELEASE.md` | GitHub metadata |
| `docs/PROJECT_METRICS.md` | This file |

---

## CI/CD

| Job | Command |
|-----|---------|
| Lint | `npm run lint` |
| Test | `npm test` + `npm run test:coverage` |
| Build | `npm run build:netlify` |

Trigger: push/PR to `main` or `master`.

---

## Readiness scores (RC1)

| Assessment | Score |
|------------|------:|
| RC1 release audit | 78/100 |
| Checklist production readiness | 82/100 |
| Documentation quality | 7.8/10 |
| Portfolio readiness | 85/100 |
| Interview readiness | 88/100 |
