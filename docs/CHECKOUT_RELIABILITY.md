# Checkout Reliability Report (Sprint 10)

> **Date:** 2026-06-07  
> **Scope:** Payment simulation, API tests, cart validation, full checkout E2E — no Razorpay, no new product features.

## Coverage

| Metric | Before (Sprint 9) | After (Sprint 10) |
| ------ | ----------------- | ----------------- |
| Vitest tests | 54 | **70** |
| Playwright E2E | 5 | **6** (+ full checkout) |
| Overall lines (`src/lib/**` + `src/app/api/**`) | ~42% | **50.13%** |
| `POST /api/payments` | 0% | **80%** |
| `POST /api/cart/validate` | 0% | **100%** |

Run: `npm run test:coverage` and `npm run test:e2e`.

## Payment confidence assessment

| Area | Confidence | Evidence |
| ---- | ---------- | -------- |
| Success path (PAID + CONFIRMED + stock deduct) | **High** | `payments.test.ts` + checkout E2E |
| Failure path (FAILED, no stock change) | **High** | `TEST_PAYMENT_MODE=failure` + integration test |
| Timeout (408, state unchanged) | **High** | `TEST_PAYMENT_MODE=timeout` + integration test |
| Stock race / 409 | **High** | Pre-check, transaction recheck, `stock_changed` sim |
| Expiry before pay | **High** | Integration test + existing lifecycle |
| Production gateway | **None** | Simulated only by design |

## Checkout confidence assessment

| Step | Confidence | Tests |
| ---- | ---------- | ----- |
| Cart validate | **High** | `cart-validate.test.ts` (9 cases) |
| Order create (server-side pricing) | **Medium** | Covered indirectly via cart + orders tests |
| Payment → receipt + QR | **High** | Integration + E2E |
| Staff queue visibility | **High** | E2E |
| QR verify + handover | **High** | E2E (photo QR upload) + `verify.test.ts` |

## Remaining risks

| Risk | Severity | Mitigation status |
| ---- | -------- | ----------------- |
| No real payment gateway | High (prod) | Out of scope Sprint 10 |
| `FAILED` not shown with dedicated retry UI | Medium | API writes FAILED; client generic error |
| Double-submit payment (no idempotency key) | Medium | Second request returns "already paid" after success |
| Concurrent stock races in production load | Medium | Documented; 409 on race |
| E2E depends on Playwright browsers installed | Low | `npx playwright install chromium` |
| Price not re-validated at `/api/cart/validate` | Low | Server prices at order create |

## Updated readiness score

| Category | Sprint 9 | Sprint 10 |
| -------- | -------- | --------- |
| Payments | 3/10 | **5/10** (failure/timeout sim + tests; still no gateway) |
| Test coverage | 6/10 | **7/10** |
| **Overall** | **78 / 100** | **82 / 100** |

**Beta ready:** Yes — core loop regression-protected.  
**Production ready:** No — still requires Razorpay (or equivalent) and payment-failure UX polish.

## Related docs

- [`PAYMENT_FLOW.md`](./PAYMENT_FLOW.md) — state diagram, gaps, simulation
- [`TESTING.md`](./TESTING.md) — `TEST_PAYMENT_MODE` usage
- [`ORDER_LIFECYCLE.md`](./ORDER_LIFECYCLE.md) — status transitions
- [`QR_PICKUP_SECURITY.md`](./QR_PICKUP_SECURITY.md) — pickup secret
