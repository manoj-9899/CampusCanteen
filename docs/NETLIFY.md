# Deploy CampusCanteen on Netlify

Step-by-step guide to put your app online at a public URL (e.g. `https://campus-canteen.netlify.app`).

---

## Important: database change required

**SQLite (`file:./dev.db`) does not work on Netlify.** Serverless hosting has no persistent local disk.

| Environment | Database |
|-------------|----------|
| Your laptop (local) | SQLite — keep as-is |
| Netlify (production) | **PostgreSQL** — use free [Neon](https://neon.tech) |

You will use Neon for the live site only. Local development can stay on SQLite.

---

## Overview (5 parts)

1. Create a free Neon PostgreSQL database  
2. Prepare the project for PostgreSQL (one-time)  
3. Create tables + seed demo data on Neon  
4. Connect GitHub to Netlify and deploy  
5. Test the live site  

**Time:** ~20–30 minutes  
**Cost:** $0 (Neon free tier + Netlify free tier)

---

## Part 1 — Create Neon database

1. Go to **https://neon.tech** and sign up (GitHub login is fine).
2. Click **New Project**.
3. Name it e.g. `campus-canteen`.
4. Copy the **connection string**. It looks like:

   ```
   postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
   ```

5. Keep this safe — you will paste it into Netlify and use it once on your laptop.

---

## Part 2 — Switch Prisma to PostgreSQL (for deploy)

On your laptop, open `prisma/schema.prisma` and change:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

(Change `sqlite` → `postgresql`.)

**Do not commit your production `.env`.** Only change the schema file.

> **Tip:** After viva you can switch back to `sqlite` for easy local demo, or keep `postgresql` and use Neon URL in local `.env` too.

---

## Part 3 — Create tables and seed data on Neon

On your laptop, in the project folder:

### Windows (PowerShell)

```powershell
cd "C:\Users\manoj\Desktop\Mini Project\canteen-preorder"

# Temporarily point at Neon (paste YOUR connection string)
$env:DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

npx prisma db push
npm run db:seed
```

### Mac

```bash
cd ~/Desktop/CampusCanteen

export DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

npx prisma db push
npm run db:seed
```

You should see:

```
Seed completed.
Student: student@college.edu / student123
Staff:   staff@canteen.edu / staff123
```

**Run seed only once** on production — it resets users and orders.

Your local `.env` can still say `file:./dev.db` for day-to-day coding. Neon is only for Netlify.

---

## Part 4 — Push code to GitHub

Make sure latest code (including `netlify.toml` and `postgresql` in schema) is on GitHub:

```powershell
cd "C:\Users\manoj\Desktop\Mini Project\canteen-preorder"
git add .
git commit -m "chore: add Netlify config and PostgreSQL for deploy"
git push origin main
```

Repo: **https://github.com/manoj-9899/CampusCanteen**

---

## Part 5 — Deploy on Netlify

### 5.1 Create Netlify account

1. Go to **https://www.netlify.com**
2. Sign up → **Sign up with GitHub**
3. Authorize Netlify to read your repositories

### 5.2 Import project

1. Click **Add new site** → **Import an existing project**
2. Choose **GitHub**
3. Select repository: **CampusCanteen** (or `canteen-preorder`)
4. Netlify detects Next.js settings. Confirm:

   | Setting | Value |
   |---------|--------|
   | Branch | `main` |
   | Build command | `npm run build` |
   | Publish directory | *(leave empty — `@netlify/plugin-nextjs` handles it)* |

### 5.3 Environment variables

Before clicking **Deploy**, open **Environment variables** → **Add a variable**:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Your full Neon connection string (with `?sslmode=require`) |
| `JWT_SECRET` | A long random string (not the dev example). Example: `campus-canteen-prod-secret-2026-random-32chars` |

Click **Deploy site**.

### 5.4 Wait for build

- First build takes **3–8 minutes**
- Watch **Deploy log** for errors
- Green **Published** = success

Your URL will look like: `https://random-name-123.netlify.app`

Rename under **Site configuration → Domain management → Options → Edit site name** (e.g. `campus-canteen-demo`).

---

## Part 6 — Test live site

1. Open your Netlify URL
2. Log in as student: `student@college.edu` / `student123`
3. Place a test order
4. Open `/staff` in another tab/browser: `staff@canteen.edu` / `staff123`
5. Verify queue and QR flow

**HTTPS is automatic** — PWA install works better on Netlify than on `http://localhost`.

---

## Troubleshooting

### Build failed: Prisma / DATABASE_URL

- Add `DATABASE_URL` in Netlify **Environment variables**
- Schema must be `provider = "postgresql"` (not `sqlite`)
- Redeploy: **Deploys → Trigger deploy → Deploy site**

### Build failed: Next.js version

- Ensure `netlify.toml` exists with `@netlify/plugin-nextjs` (already in repo)
- Build command: `npm run build`

### Site loads but login fails

- Run `npx prisma db push` and `npm run db:seed` against your **Neon** URL from your laptop
- Check `JWT_SECRET` is set in Netlify env vars

### Works locally, broken on Netlify

- Local uses SQLite; Netlify needs PostgreSQL + Neon URL
- Do not set `DATABASE_URL=file:./dev.db` on Netlify

### Camera / QR on phone

- Use **HTTPS** Netlify URL (not localhost)
- Allow camera permission when staff opens Verify tab

---

## After deployment checklist

- [ ] Neon project created, connection string copied  
- [ ] `schema.prisma` uses `postgresql`  
- [ ] `prisma db push` + `db:seed` run against Neon once  
- [ ] Code pushed to GitHub  
- [ ] Netlify site connected to GitHub repo  
- [ ] `DATABASE_URL` and `JWT_SECRET` set in Netlify  
- [ ] Build succeeded  
- [ ] Student + staff login work on live URL  

---

## Local vs Netlify summary

| | Local laptop | Netlify |
|--|--------------|---------|
| Database | SQLite `file:./dev.db` | Neon PostgreSQL |
| URL | http://localhost:3000 | https://your-site.netlify.app |
| Setup | `SETUP.md` | This guide |
| Cost | Free | Free tier |

---

## Optional: auto-deploy on every push

Netlify does this by default for the `main` branch. Each `git push origin main` triggers a new deploy.

```powershell
git add .
git commit -m "feat: your change"
git push origin main
```

Wait 3–5 minutes, then refresh the Netlify URL.
