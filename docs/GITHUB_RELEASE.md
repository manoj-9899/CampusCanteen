# GitHub Release Preparation — v1.0.0-rc1

---

## Suggested repository description

> Inventory-aware college canteen pre-ordering — students pay online & collect via QR; staff manage queue, stock & sales. Next.js · Prisma · Vitest · Playwright · Netlify.

---

## GitHub topics

```
nextjs
typescript
prisma
postgresql
sqlite
tailwindcss
jwt-authentication
qr-code
inventory-management
food-ordering
canteen
playwright
vitest
pwa
full-stack
college-project
netlify
neon
react
```

---

## Release notes (copy for GitHub Releases)

### CampusCanteen v1.0.0-rc1

**Release candidate** for campus demo and portfolio showcase.

#### Highlights

- Full student flow: menu → cart → validate → pay → QR receipt
- Staff flow: pickup queue → QR verify → confirm handover
- Inventory-aware ordering with stock deduction on payment
- QR v2 pickup security with cryptographic secret
- 70 Vitest tests + 6 Playwright E2E tests (~50% API/lib coverage)
- CI: lint, test, production build
- Netlify + Neon deployment path documented

#### Known limitations

- Simulated payments only (no Razorpay)
- Demo seed credentials — rotate for public URLs
- `prisma db push` — no migration history
- Open student registration

#### Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Deployment checklist](./docs/DEPLOYMENT_CHECKLIST.md)
- [Demo script](./docs/DEMO_SCRIPT.md)
- [Interview guide](./docs/INTERVIEW_GUIDE.md)

#### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Student | student@college.edu | student123 |
| Staff | staff@canteen.edu | staff123 |

---

## Project tags (internal / portfolio)

`rc1` · `release-candidate` · `campus-demo` · `inventory-aware` · `qr-pickup` · `simulated-payments` · `portfolio-project` · `mini-project` · `sprint-10-complete`

---

## Showcase summary (LinkedIn / portfolio site)

**CampusCanteen** — A full-stack canteen pre-ordering platform I built with Next.js 16 and TypeScript. Students browse real-time stock, complete a validated checkout, and collect food using a QR-backed pickup token. Staff manage orders, inventory, and daily sales from a dedicated dashboard.

**Impact:** Prevents overselling of batch-prepared items; digitizes the pickup queue; reduces counter confusion with token + QR verification.

**Engineering:** 16 API routes, 4 Prisma models, 59 React components, JWT auth with role-based access, 70 automated tests, CI/CD, Netlify + Neon deploy.

**Status:** v1.0.0-rc1 — feature-frozen, portfolio-ready, simulated payments for demo.

**Links:** [GitHub repo] · [Live demo] · [Architecture doc]

---

## Tag command

```bash
git tag -a v1.0.0-rc1 -m "CampusCanteen release candidate 1"
git push origin v1.0.0-rc1
```

Create GitHub Release from tag and paste release notes above.
