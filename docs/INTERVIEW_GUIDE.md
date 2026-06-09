# CampusCanteen Interview Guide

> Technical talking points for `v1.0.0-rc1`. Pair with [ARCHITECTURE.md](./ARCHITECTURE.md) and [DEMO_SCRIPT.md](./DEMO_SCRIPT.md).

---

## Explain the architecture

**Elevator pitch:** CampusCanteen is a Next.js full-stack app where students pre-order in-stock canteen food, pay online (simulated in RC1), and collect with a QR-backed pickup token. Staff manage queue, inventory, and verification from a separate dashboard.

**Stack choice:** Next.js App Router gives one repo for UI + API routes, easy Netlify deploy, and TypeScript end-to-end. Prisma abstracts SQLite (dev) and PostgreSQL (prod) with the same client.

**Separation:** Student (`/`) and staff (`/staff`) apps share auth but use role guards on every sensitive API. Business rules live in `src/lib/*` — routes stay thin.

---

## Explain authentication

1. **Register/login** → bcrypt (cost 10) → JWT signed with `jose` (HS256, 7-day expiry)
2. Token stored in **HTTP-only cookie** (`secure` in production, `sameSite: lax`)
3. **`requireSession()`** on API routes decodes JWT **and** reloads user from DB — stale sessions fail after DB reset
4. **Staff registration blocked** at API — only `STUDENT` role on register
5. **Middleware** protects `/staff` pages; APIs enforce roles independently

**Why not sessions in DB?** JWT + DB re-validation balances statelessness with account revocation on schema reset; RC1 scope — production might add refresh tokens or session table.

---

## Explain QR verification

**Problem:** Anyone who sees a token number could claim someone else's order.

**Solution (Sprint 8):**

- On payment, generate `pickupSecret` (cryptographic random)
- QR payload v2: `{ v: 2, orderId, s }` — secret never in order list API
- Staff `POST /api/orders/verify` requires `pickupSecret` when order has one
- Compare with **timing-safe** function to prevent timing attacks

**Trade-off:** Staff can still "Mark ready" without QR via PATCH — documented gap for RC1.

---

## Explain inventory consistency

**Three checkpoints:**

1. **Cart validate** (`POST /api/cart/validate`) — before review step
2. **Order create** — server re-checks stock, snapshots `unitPrice`
3. **Payment** — pre-check + transaction re-check + `deductStock` atomically

**Race:** If stock changes between check and payment, transaction throws `STOCK_CHANGED` → 409.

**Cancel:** Unpaid pending — no deduction. Paid cancel — `restoreStock()`.

**Cash sales:** Not tracked — staff toggles "Sold out" manually.

---

## Explain testing strategy

| Layer | Why |
|-------|-----|
| **Unit** | Pure logic: lifecycle transitions, inventory math, QR parse, rate limits |
| **Integration** | API handlers with real SQLite test DB — auth, payments, verify |
| **E2E** | One full business path: student checkout → staff QR verify → handover |

**Determinism:** `prepare-test-prisma.mjs` isolates test schema; rate limit store reset between tests; `TEST_PAYMENT_MODE` simulates payment outcomes without a gateway.

**Coverage:** ~50% on `src/lib` + `src/app/api` — critical paths (payments, cart, verify) >80%.

---

## Explain deployment

- **Local:** SQLite file, zero infra
- **Prod:** Netlify serverless + Neon PostgreSQL
- **Build:** `netlify-build.mjs` swaps Prisma schema to PostgreSQL before `next build`
- **Seed once** on Neon — not per deploy
- **CI:** lint + 70 tests + production build on every PR

---

## Explain design decisions

| Decision | Rationale |
|----------|-----------|
| Simulated payments (RC1) | Focus on inventory + pickup loop; Razorpay deferred |
| Separate `Order.status` and `paymentStatus` | Kitchen progress ≠ payment state |
| Price snapshot on `OrderItem` | Menu price changes don't alter past orders |
| 15-minute pending expiry | Prevents orphan unpaid orders blocking stock perception |
| In-memory rate limits | Simple for demo; document serverless limitation |
| Hooks + panels refactor (Sprint 7) | Maintainability without changing behavior |
| PWA not native app | Faster delivery, installable on phones for demo |

---

## Common interviewer questions

**Q: How do you prevent overselling?**  
A: Stock validated at cart, order create, and payment transaction with atomic decrement. Negative stock throws in `deductStock`.

**Q: What happens if payment fails?**  
A: RC1 sim supports `FAILED` status; order stays `PENDING`, stock unchanged. Real gateway would webhook similarly.

**Q: How is security handled?**  
A: bcrypt, JWT httpOnly cookies, Zod validation, Prisma (no SQL injection), role checks, rate limits, pickup secret on QR.

**Q: Why Next.js API routes vs separate Express?**  
A: Single deploy unit, shared types, colocation with UI — appropriate for monolith demo and Netlify.

**Q: Scalability limits?**  
A: In-memory rate limits, `db push` not migrations, polling not WebSockets, serverless cold starts — honest RC1 boundaries.

**Q: What would you add for production?**  
A: Razorpay, Prisma migrations, Redis rate limits, payment failure UI, password reset, E2E in CI, stricter QR on mark-ready.

**Q: Hardest bug you solved?**  
A: Order lifecycle — `confirm-handover` could complete from wrong state; unified through `applyStaffStatusUpdate` and `confirmStaffHandover`.

**Q: How do you test QR without a camera in CI?**  
A: Integration tests hit verify API with `orderId` + `pickupSecret`; E2E generates QR PNG file for photo upload path.
