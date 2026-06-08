# CampusCanteen — Easy Setup Guide

Run the project on **Windows** or **MacBook** in a few minutes. No Docker, no PostgreSQL — the database is a single SQLite file (`prisma/dev.db`).

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | 18 or newer (LTS recommended) | [nodejs.org](https://nodejs.org) |
| **Git** (optional) | Any recent version | [git-scm.com](https://git-scm.com) |

**Mac only (optional):** Install Node via Homebrew:

```bash
brew install node
```

Check installations:

```bash
node -v
npm -v
```

---

## Get the project

### Option A — GitHub (recommended)

```bash
git clone <your-repository-url>
cd canteen-preorder
```

### Option B — Zip file

1. Extract the zip to a folder (e.g. `Desktop/canteen-preorder`).
2. Open Terminal (Mac) or PowerShell (Windows) in that folder.

**Do not** copy `node_modules` or `.next` — they are recreated by `npm install`.

---

## Setup (same on Windows and Mac)

Run these commands **inside the `canteen-preorder` folder**:

### Windows (PowerShell or Command Prompt)

```powershell
copy .env.example .env
npm install
npm run db:setup
npm run dev
```

### MacBook (Terminal)

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

When you see `Ready`, open:

**http://localhost:3000**

---

## Demo login accounts

| Role | Email | Password |
|------|-------|----------|
| Student | `student@college.edu` | `student123` |
| Staff | `staff@canteen.edu` | `staff123` |

**Staff dashboard:** http://localhost:3000/staff

---

## Test on phone (same Wi‑Fi)

The dev server listens on your laptop’s network IP.

### Windows

```powershell
ipconfig
```

Use the **IPv4 Address** (e.g. `192.168.1.5`).

### MacBook

```bash
ipconfig getifaddr en0
```

If that returns nothing, try `en1`, or check **System Settings → Network**.

On your phone browser:

```
http://YOUR_LAPTOP_IP:3000
```

Allow **Node.js** through the firewall if the phone cannot connect (Windows).

---

## Useful commands

| Command | What it does |
|---------|----------------|
| `npm run dev` | Start development server |
| `npm run db:setup` | Create database + demo menu & users |
| `npm run db:seed` | Reset demo data (orders, users, stock) |
| `npm run build` | Production build (for deployment) |

**Stop the server:** `Ctrl + C` in the terminal.

---

## Troubleshooting

### `pdflatex` / report PDF

See `docs/batu-project-report/README.md` for the LaTeX report. Not required to run the app.

### Port 3000 already in use

**Windows:**

```powershell
netstat -ano | findstr :3000
taskkill /PID <number_from_last_column> /F
```

**Mac:**

```bash
lsof -i :3000
kill -9 <PID>
```

Then run `npm run dev` again.

### `DATABASE_URL` / database errors

Make sure `.env` exists and contains:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="any-random-string-for-local-dev"
```

Then run:

```bash
npm run db:setup
```

### Login fails or empty menu

Run a fresh setup:

```bash
npm run db:setup
```

Restart the dev server (`Ctrl + C`, then `npm run dev`).

### Chrome reloads endlessly or shows wrong page

1. Close all `localhost:3000` tabs.
2. Open a **new** tab → http://localhost:3000
3. Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac).
4. Or clear site data: DevTools → Application → Clear site data.

Safari or Brave often work without this step.

### `npm install` errors on Mac (Apple Silicon)

Use a recent Node.js LTS from nodejs.org. If Prisma fails, try:

```bash
rm -rf node_modules package-lock.json
npm install
npm run db:setup
```

### Wrong project folder

Always run commands from:

```
canteen-preorder/
```

You should see `package.json`, `src/`, and `prisma/` in the same folder.

---

## What gets created locally

| Path | Purpose |
|------|---------|
| `.env` | Your local secrets (not in Git) |
| `prisma/dev.db` | SQLite database with demo data |
| `node_modules/` | Dependencies (from `npm install`) |
| `.next/` | Next.js build cache |

---

## Quick checklist

- [ ] Node.js 18+ installed
- [ ] Project folder opened in terminal
- [ ] `.env` created from `.env.example`
- [ ] `npm install` completed
- [ ] `npm run db:setup` completed
- [ ] `npm run dev` running
- [ ] http://localhost:3000 opens in browser
- [ ] Student or staff login works

---

## Need help?

1. Read the error in the terminal — it usually says what is missing.
2. Run `npm run db:setup` again.
3. Restart `npm run dev`.
4. Ask your teammate to compare their `.env` and Node version with yours.
