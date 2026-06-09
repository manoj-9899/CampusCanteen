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

## Part 2 — No manual schema edit needed

The repo keeps **SQLite** for local dev (`prisma/schema.prisma`) and a copy
**`prisma/schema.postgresql.prisma`** for production.

- **Netlify** runs `scripts/netlify-build.mjs` before build (see `netlify.toml`) — swaps to PostgreSQL automatically.
- **Your laptop** stays on SQLite for `npm run dev` after Neon setup.

---

## Part 3 — Create tables and seed data on Neon

On your laptop, in the project folder (one-time):

### Windows (PowerShell)

```powershell
cd "C:\Users\manoj\Desktop\Mini Project\canteen-preorder"

# Paste YOUR Neon connection string
$env:DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

npm run db:setup:neon
```

This pushes the schema to Neon, seeds demo users/menu, then **restores SQLite** for local dev.

### Mac

```bash
cd ~/path/to/canteen-preorder

export DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

npm run db:setup:neon
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

Make sure latest code (including `netlify.toml`, `schema.postgresql.prisma`, and UI changes) is on GitHub:

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
   | Build command | `node scripts/netlify-build.mjs && npm run build` *(or leave empty — `netlify.toml` sets this)* |
   | Publish directory | *(leave empty — `@netlify/plugin-nextjs` handles it)* |

   > **Important:** The repo’s `netlify.toml` already runs the PostgreSQL schema swap before build. If you override the build command in the Netlify UI, use the full command above — not `npm run build` alone.

### 5.3 Environment variables

Before clicking **Deploy**, open **Environment variables** → **Add a variable**:

| Key | Value | Required |
|-----|--------|----------|
| `DATABASE_URL` | Full Neon connection string (with `?sslmode=require`) | Yes |
| `JWT_SECRET` | Long random string — **not** the `.env.example` value. `openssl rand -base64 32` | Yes |
| `NODE_VERSION` | `20` | No (set in `netlify.toml`) |

**Do not set on Netlify:**

| Key | Reason |
|-----|--------|
| `TEST_PAYMENT_MODE` | Dev/test only; production ignores it but avoid confusion |
| `DATABASE_URL=file:./dev.db` | SQLite does not work on Netlify |

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

## Demo credentials policy (RC1)

The seed script creates **known demo accounts** for presentations and QA:

| Account | Email | Default password |
|---------|-------|------------------|
| Student | `student@college.edu` | `student123` |
| Staff | `staff@canteen.edu` | `staff123` |

### Acceptable for RC1

- Classroom demos, viva, controlled campus Wi‑Fi
- Netlify preview URLs shared only with evaluators

### Required before any wider public launch

1. **Rotate passwords** in Neon (update `User.password` with bcrypt hashes) or remove seed users and create real accounts manually
2. **Do not re-run** `npm run db:setup:neon` against production — it deletes all orders and resets users
3. Consider disabling open registration or adding an allowlist (future sprint — not in RC1)
4. Label the site as **demo / RC1** in the UI or URL (e.g. `campus-canteen-demo.netlify.app`)

RC1 uses **simulated payments** — no real money is collected regardless of credentials.

---

## Troubleshooting

### Build failed: Prisma / DATABASE_URL

- Add `DATABASE_URL` in Netlify **Environment variables**
- Schema must be `provider = "postgresql"` (not `sqlite`)
- Redeploy: **Deploys → Trigger deploy → Deploy site**

### Build failed: Next.js version

- Ensure `netlify.toml` exists with `@netlify/plugin-nextjs` (already in repo)
- Build command must include schema swap: `node scripts/netlify-build.mjs && npm run build`

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

See also **[docs/RC1_RELEASE.md](./RC1_RELEASE.md)** for the full RC1 deployment checklist.

- [ ] Neon project created, connection string copied  
- [ ] `npm run db:setup:neon` run against Neon **once** (not on every deploy)  
- [ ] Code tagged or pushed at `v1.0.0-rc1`  
- [ ] Netlify site connected to GitHub repo  
- [ ] `DATABASE_URL` and `JWT_SECRET` set in Netlify (strong secret, not example)  
- [ ] Build command matches `netlify.toml` (schema swap + build)  
- [ ] CI green: lint, test, `build:netlify`  
- [ ] Build succeeded on Netlify  
- [ ] Student checkout + staff QR verify on live URL  
- [ ] Demo credential policy documented for your audience  

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
