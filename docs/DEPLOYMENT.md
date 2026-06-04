# CampusCanteen — Local demo + Vercel deploy

You can run the **same app** in two places:

| Where | Database | URL |
|-------|----------|-----|
| **Your laptop** (viva demo) | PostgreSQL (Docker or Neon) | `http://localhost:3000` |
| **Vercel** (public link) | PostgreSQL (Vercel Postgres / Neon) | `https://your-app.vercel.app` |

The app code is identical. Only `DATABASE_URL` and `JWT_SECRET` change per environment.

---

## Part 1 — Local machine demo

### Option A — Docker Postgres (recommended, works offline)

**Requirements:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

```bash
cd canteen-preorder

# 1. Environment
copy .env.example .env
# Edit .env — DATABASE_URL should be:
# postgresql://canteen:canteen@localhost:5432/canteen

# 2. Start database
docker compose up -d

# 3. Install & create tables + demo data
npm install
npm run db:setup

# 4. Run app
npm run dev
```

Open **http://localhost:3000**  
Phone on same Wi‑Fi: **http://YOUR_LAPTOP_IP:3000** (see README).

Stop database when done: `docker compose down`

### Option B — Neon (no Docker, needs internet)

1. Sign up at [https://neon.tech](https://neon.tech) (free).
2. Create a project → copy **connection string**.
3. Put it in `.env` as `DATABASE_URL` (include `?sslmode=require` if Neon shows it).
4. Run `npm run db:setup` then `npm run dev`.

Use a **separate** Neon branch or project for production on Vercel so demo data on your laptop does not overwrite live data.

---

## Part 2 — Deploy on Vercel

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
   | `DATABASE_URL` | From Vercel Postgres / Neon (auto-linked if using Vercel Storage) |
   | `JWT_SECRET` | Long random string (not the dev example from `.env.example`) |

5. **Deploy** — first build may succeed before tables exist.

6. **Create tables + seed once** (from your laptop, with production `DATABASE_URL`):

   ```bash
   # Temporarily set DATABASE_URL to the Vercel/Neon production URL, then:
   npx prisma db push
   npm run db:seed
   ```

   Or use Vercel CLI / Neon SQL console. **Run seed only once** — it resets orders and users.

7. Open your `https://….vercel.app` URL and log in with demo accounts from README.

### Build settings (usually automatic)

- **Build command:** `prisma generate && next build` (already in `package.json` `build`)
- **Install:** `npm install` runs `postinstall` → `prisma generate`

Do **not** add `prisma db push` to every production deploy unless you intend to apply schema changes each time.

---

## Local vs production checklist

| Task | Local (Docker) | Vercel |
|------|----------------|--------|
| Database | `docker compose up -d` | Vercel Postgres / Neon |
| `DATABASE_URL` | `postgresql://canteen:canteen@localhost:5432/canteen` | Production URL from dashboard |
| `JWT_SECRET` | Any string for demo | Strong random secret |
| HTTPS | No (HTTP OK for LAN demo) | Yes (automatic) |
| PWA install button | Limited on HTTP | Works on HTTPS |
| Seed database | `npm run db:seed` anytime for fresh demo | **Once** after first deploy |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Can't reach database` locally | Is Docker running? `docker compose ps` |
| Port 5432 in use | Stop other Postgres or change port in `docker-compose.yml` |
| Vercel build OK but login fails | Run `prisma db push` + `db:seed` against production `DATABASE_URL` |
| Data gone after Vercel redeploy | You were using SQLite on Vercel before — use Postgres only |
| Phone cannot open site | Firewall port 3000; use Vercel HTTPS URL instead |

---

## What we stopped using

**SQLite** (`file:./dev.db`) is not used anymore so local and Vercel share the same database type. Old `prisma/dev.db` files are ignored; you can delete them.
