# RC1 Deployment Checklist

> Canonical deploy guide for `v1.0.0-rc1`. Step-by-step: **[NETLIFY.md](./NETLIFY.md)**.

---

## Neon setup

- [ ] Create project at [neon.tech](https://neon.tech)
- [ ] Copy connection string with `?sslmode=require`
- [ ] Store URL in password manager (not in git)
- [ ] Run **once** from developer machine:

  ```powershell
  $env:DATABASE_URL="postgresql://USER:PASS@ep-xxx.neon.tech/neondb?sslmode=require"
  npm run db:setup:neon
  ```

- [ ] Confirm seed output (demo users created)
- [ ] **Never** re-run `db:setup:neon` on production after go-live

---

## Netlify setup

- [ ] Sign in at [netlify.com](https://www.netlify.com) with GitHub
- [ ] Import repository `CampusCanteen` / `canteen-preorder`
- [ ] Branch: `main`
- [ ] Build command: `node scripts/netlify-build.mjs && npm run build` *(from `netlify.toml`)*
- [ ] Publish directory: leave empty (`@netlify/plugin-nextjs`)
- [ ] Node version: `20` (in `netlify.toml` or env)

---

## Environment variables

| Variable | Where | Value |
|----------|-------|--------|
| `DATABASE_URL` | Netlify dashboard | Neon PostgreSQL URL |
| `JWT_SECRET` | Netlify dashboard | `openssl rand -base64 32` or 32+ random chars |
| `NODE_VERSION` | Optional | `20` |

**Do not set:**

- `TEST_PAYMENT_MODE` (dev/test only)
- `DATABASE_URL=file:./dev.db` (SQLite fails on Netlify)

Reference: `.env.example`

---

## Database setup

| Environment | Command | When |
|-------------|---------|------|
| Local dev | `npm run db:setup` | First clone, reset demo |
| Production Neon | `npm run db:setup:neon` | **Once** before first deploy |
| Tests | `npm test` (auto) | CI / local test runs |

Schema strategy: `prisma db push` (no migration history in RC1).

---

## Build verification

Run locally before tagging or after major changes:

```bash
npm run lint          # 0 errors (warnings OK)
npm test              # 70 tests
npm run build:netlify
```

CI (`.github/workflows/test.yml`) runs lint, test, and `build:netlify` on push/PR.

**After `build:netlify` locally:** schema may be PostgreSQL — run `node scripts/restore-dev-prisma.mjs` for SQLite dev.

---

## Smoke tests (post-deploy)

### Student

- [ ] Open site URL (HTTPS)
- [ ] Login `student@college.edu` / `student123`
- [ ] Add item → Review → Confirm → Pay
- [ ] Receipt shows token + QR image

### Staff

- [ ] Login `staff@canteen.edu` / `staff123`
- [ ] `/staff` loads (student redirected from `/staff`)
- [ ] Order visible in Pickup queue
- [ ] Verify QR or token → Confirm handover
- [ ] Student receipt updates to collected

### Security quick checks

- [ ] Anonymous `/staff` → login redirect
- [ ] Logout clears session
- [ ] Invalid staff JWT rejected

---

## Rollback strategy

| Scenario | Action |
|----------|--------|
| Bad deploy (app code) | Netlify → Deploys → **Rollback** to previous publish |
| Broken build | Fix in git → push → auto-redeploy |
| Bad env var | Restore previous `JWT_SECRET` / `DATABASE_URL` in Netlify → trigger redeploy |
| Accidental re-seed | **No automatic rollback** — restore Neon from backup or re-seed and accept data loss |
| Schema mismatch | Run `db:push` against Neon from laptop with correct `schema.postgresql.prisma` |

**RC1 note:** No blue/green or migration versioning — rollback is Netlify deploy history + Neon backup discipline.

---

## Demo credentials policy

| Audience | Action |
|----------|--------|
| Viva / classroom | Default seed passwords OK |
| Public demo URL | Rotate passwords or restrict URL sharing |
| Production (future) | Remove seed creds; real auth policies |

See demo policy section in [NETLIFY.md](./NETLIFY.md).
