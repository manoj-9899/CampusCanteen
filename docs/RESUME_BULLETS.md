# CampusCanteen — Resume Content

> Copy-ready bullets for portfolios and job applications. Metrics from `v1.0.0-rc1`.

---

## Short resume bullets (1 line each)

- Built **CampusCanteen**, a full-stack canteen pre-order web app with inventory-aware checkout and QR pickup verification.
- Developed **16 REST API routes** and **4 Prisma models** using Next.js 16, TypeScript, and PostgreSQL/SQLite.
- Implemented **JWT authentication**, role-based access, and timing-safe QR pickup secrets for staff verification.
- Wrote **70 automated tests** (Vitest + Playwright) with **50%+ coverage** on API and business-logic layers.
- Deployed to **Netlify + Neon** with CI pipeline (lint, test, production build).

---

## Medium resume bullets (2–3 lines each)

**Full-stack canteen ordering system**  
Designed and built CampusCanteen — students browse live stock, pay online (simulated), and collect via token + QR; staff manage queue, inventory, and sales dashboard. Next.js App Router, Prisma ORM, Tailwind CSS.

**Inventory & checkout reliability**  
Engineered stock validation at cart, order, and payment with transactional deduction and race-condition handling (409 on stock change). Documented order lifecycle with 15-minute pending expiry and student cancellation flows.

**Security & testing**  
Implemented bcrypt auth, HTTP-only JWT cookies, Zod input validation, rate limiting, and QR v2 pickup secrets. **70 unit/integration tests** plus **6 E2E** flows including full checkout; GitHub Actions CI with lint and Netlify build verification.

---

## Detailed project description (paragraph)

CampusCanteen is a production-style web application for college canteen pre-ordering that prevents overselling of batch-prepared food. I built the complete stack as a Next.js 16 monolith with TypeScript: **59 React components**, **5 custom hooks**, and **22 API handlers** backed by Prisma and PostgreSQL (Neon) in production, SQLite locally. The student flow covers menu browsing with availability labels, cart validation, simulated payment, and QR receipt generation. The staff flow includes a live pickup queue, QR/token verification with cryptographic pickup secrets, inventory management, menu CRUD, daily sales analytics, and demand forecasting. I enforced security through JWT sessions, role-based authorization, rate limits, and server-side secret stripping. Quality was validated with **70 Vitest tests**, Playwright E2E covering the full order-to-handover path, and continuous integration. The app deploys to Netlify with automated PostgreSQL schema switching and is tagged **v1.0.0-rc1** as a release candidate for campus demo.

---

## Technical achievement highlights

| Achievement | Detail |
|-------------|--------|
| End-to-end business test | Playwright: login → pay → QR → staff verify → handover |
| Payment route coverage | 80% with failure/timeout/stock-race simulation |
| Order lifecycle hardening | Unified staff transitions; blocked invalid handover paths |
| QR security | v2 payload with `pickupSecret`; timing-safe verification |
| Mobile-first PWA | Safe areas, touch targets, offline banner, install manifest |
| Dual-database dev/prod | SQLite local + Neon production without code branches |
| Documentation | 17 technical docs including architecture, deploy, interview guide |
| Readiness | RC1 audit 78/100; feature-complete for campus demo |

---

## Skills to tag on resume / LinkedIn

`Next.js` · `TypeScript` · `React` · `Prisma` · `PostgreSQL` · `SQLite` · `REST API` · `JWT` · `Tailwind CSS` · `Vitest` · `Playwright` · `GitHub Actions` · `Netlify` · `Neon` · `Zod` · `QR Codes` · `PWA`
