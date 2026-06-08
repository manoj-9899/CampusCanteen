# CampusCanteen — Local demo + optional Vercel deploy

## Part 1 — Local machine demo (SQLite)

No Docker, no Postgres install. The database is a single file: `prisma/dev.db`.

```bash
cd canteen-preorder

# 1. Environment
copy .env.example .env
# DATABASE_URL should be: file:./dev.db

# 2. Install & create tables + demo data
npm install
npm run db:setup

# 3. Run app
npm run dev
```

Open **http://localhost:3000**  
Phone on same Wi‑Fi: **http://YOUR_LAPTOP_IP:3000** (see README).

**Reset demo data anytime:** `npm run db:seed`

---

## Part 2 — Deploy on Vercel (optional)

Local dev uses SQLite. For a public Vercel deploy you need **PostgreSQL** (Vercel Postgres or Neon) and must change `provider` in `prisma/schema.prisma` from `sqlite` to `postgresql`, then set a `postgresql://…` `DATABASE_URL`.

### Prerequisites

- GitHub account
- Project pushed to a GitHub repository
- Vercel account ([vercel.com](https://vercel.com))

### Steps

1. **Push code to GitHub** (do not commit `.env` — it is gitignored).

2. **Import** the repo in Vercel → **New Project** → select repo → Framework: Next.js.

3. **Add PostgreSQL**
   - Vercel project → **Storage** → **Create Database** → **Postgres**  
   - Or connect an existing **Neon** database and add its URL manually.

4. **Environment variables** (Vercel → Settings → Environment Variables):

   | Name | Value |
   |------|--------|
   | `DATABASE_URL` | From Vercel Postgres / Neon |
   | `JWT_SECRET` | Long random string (not the dev example from `.env.example`) |

5. **Deploy** — first build may succeed before tables exist.

6. **Create tables + seed once** (from your laptop, with production `DATABASE_URL` and `postgresql` provider in schema):

   ```bash
   npx prisma db push
   npm run db:seed
   ```

   **Run seed only once** on production — it resets orders and users.

7. Open your `https://….vercel.app` URL and log in with demo accounts from README.

### Build settings (usually automatic)

- **Build command:** `prisma generate && next build` (already in `package.json` `build`)
- **Install:** `npm install` runs `postinstall` → `prisma generate`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `URL must start with postgresql://` | `.env` should be `file:./dev.db` and schema `provider = "sqlite"` |
| Login fails after fresh clone | Run `npm run db:setup` |
| Vercel build OK but login fails | Switch schema to `postgresql`, run `prisma db push` + `db:seed` against production `DATABASE_URL` |
| Phone cannot open site | Firewall port 3000; use Vercel HTTPS URL instead |
