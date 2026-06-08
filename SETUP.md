# CampusCanteen — Detailed Setup Guide

Complete step-by-step instructions to run the project on **Windows** or **MacBook**.  
No Docker. No PostgreSQL. Database is a local SQLite file (`prisma/dev.db`).

**Repository:** https://github.com/manoj-9899/CampusCanteen

---

## Table of contents

1. [Install prerequisites](#step-1-install-prerequisites)
2. [Get the project code](#step-2-get-the-project-code)
3. [Open terminal in project folder](#step-3-open-terminal-in-project-folder)
4. [Create environment file](#step-4-create-environment-file-env)
5. [Install dependencies](#step-5-install-dependencies)
6. [Set up database](#step-6-set-up-database)
7. [Start the app](#step-7-start-the-app)
8. [Verify it works](#step-8-verify-it-works)
9. [Test on phone (optional)](#step-9-test-on-phone-optional)
10. [Pull updates from GitHub](#step-10-pull-updates-from-github)
11. [Troubleshooting](#troubleshooting)
12. [Command reference](#command-reference)

---

## Step 1: Install prerequisites

You need **Node.js** (includes `npm`). Git is needed only if you clone from GitHub.

### Windows

1. Open https://nodejs.org
2. Download the **LTS** version (recommended).
3. Run the installer → Next → accept license → Next → Install.
4. Restart PowerShell or Command Prompt.
5. Verify:

```powershell
node -v
npm -v
```

You should see version numbers (e.g. `v22.x.x` and `10.x.x`).

### MacBook

**Option A — Official installer**

1. Open https://nodejs.org
2. Download **LTS** for macOS.
3. Open the `.pkg` file and complete installation.
4. Open **Terminal** (Applications → Utilities → Terminal).
5. Verify:

```bash
node -v
npm -v
```

**Option B — Homebrew** (if you already use Homebrew)

```bash
brew install node
node -v
npm -v
```

### Install Git (if not installed)

- **Windows:** https://git-scm.com/download/win  
- **Mac:** `xcode-select --install` or https://git-scm.com/download/mac

Check:

```bash
git --version
```

---

## Step 2: Get the project code

### Option A — Clone from GitHub (recommended)

**Windows (PowerShell):**

```powershell
cd Desktop
git clone https://github.com/manoj-9899/CampusCanteen.git
cd CampusCanteen
```

**Mac (Terminal):**

```bash
cd ~/Desktop
git clone https://github.com/manoj-9899/CampusCanteen.git
cd CampusCanteen
```

> Folder name may be `CampusCanteen` (from GitHub) or `canteen-preorder` (if renamed). Use whichever folder was created.

### Option B — Zip from teammate

1. Extract the zip to `Desktop`.
2. Do **not** expect `node_modules` or `.next` inside — they are created during setup.
3. Open the extracted folder.

---

## Step 3: Open terminal in project folder

You must run all setup commands **inside** the project folder.

### Windows

1. Open File Explorer → go to the project folder.
2. Click the address bar, type `powershell`, press Enter.

Or in PowerShell:

```powershell
cd "C:\Users\YOUR_NAME\Desktop\CampusCanteen"
```

### Mac

```bash
cd ~/Desktop/CampusCanteen
```

### Confirm you are in the right place

**Windows:**

```powershell
dir
```

**Mac:**

```bash
ls
```

You should see: `package.json`, `src`, `prisma`, `README.md`, `SETUP.md`.

---

## Step 4: Create environment file (`.env`)

The app needs a local `.env` file. It is **not** in GitHub (for security).

### Windows

```powershell
copy .env.example .env
```

### Mac

```bash
cp .env.example .env
```

### What should be inside `.env`

Open `.env` in any text editor. It should look like:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="canteen-preorder-dev-secret-change-in-production"
```

You can keep these values for local development. Do **not** commit `.env` to GitHub.

---

## Step 5: Install dependencies

This downloads all npm packages into `node_modules/`. First run may take 2–5 minutes.

```bash
npm install
```

**What you should see:**

- Progress bars / package names scrolling
- Ends without `ERR!` in red
- `prisma generate` runs automatically (`postinstall` script)

**If it fails:**

- Check internet connection
- Ensure Node.js 18+ (`node -v`)
- See [Troubleshooting](#troubleshooting)

---

## Step 6: Set up database

Creates the SQLite database and loads demo users + menu.

```bash
npm run db:setup
```

**What this does:**

1. `prisma db push` — creates `prisma/dev.db` and tables
2. `tsx prisma/seed.ts` — adds demo accounts and menu items

**Success output includes:**

```
Seed completed.
Student: student@college.edu / student123
Staff:   staff@canteen.edu / staff123
```

---

## Step 7: Start the app

```bash
npm run dev
```

**Wait until you see:**

```
✓ Ready in ...ms
- Local:   http://localhost:3000
```

Leave this terminal window **open** while using the app.

**Stop the server:** press `Ctrl + C` in the terminal.

---

## Step 8: Verify it works

1. Open a browser (Chrome, Edge, Safari, or Brave).
2. Go to: **http://localhost:3000**
3. You should see the **CampusCanteen** login page.

### Test student login

| Field | Value |
|-------|-------|
| Email | `student@college.edu` |
| Password | `student123` |

After login you should see the **menu** with items (Samosa, Vada Pav, etc.).

### Test staff login

1. Log out (top right).
2. Log in with:

| Field | Value |
|-------|-------|
| Email | `staff@canteen.edu` |
| Password | `staff123` |

3. Or open directly: **http://localhost:3000/staff**

Staff can view **Queue**, **Inventory**, **Verify** (QR), and **Forecast**.

### Quick demo flow (for viva)

1. **Student (phone or browser):** Add items → Review → Pay → Show QR on receipt.
2. **Staff (laptop):** Open queue → Mark ready → Verify token/QR → Confirm handover.

---

## Step 9: Test on phone (optional)

Useful for showing mobile UI during presentation.

1. Laptop and phone on the **same Wi‑Fi**.
2. Keep `npm run dev` running.
3. Find laptop IP:

**Windows:**

```powershell
ipconfig
```

Look for **IPv4 Address** (e.g. `192.168.1.8`).

**Mac:**

```bash
ipconfig getifaddr en0
```

4. On phone browser open:

```
http://YOUR_LAPTOP_IP:3000
```

Example: `http://192.168.1.8:3000`

**If phone cannot connect (Windows):** allow Node.js through Windows Firewall when prompted.

---

## Step 10: Pull updates from GitHub

When a teammate pushes new code, run:

**Windows / Mac:**

```bash
git pull origin main
npm install
npm run db:setup
npm run dev
```

`npm install` and `db:setup` are only needed if `package.json` or database schema changed. After small code-only changes, `git pull` + restart `npm run dev` is enough.

---

## Troubleshooting

### Port 3000 already in use

Another app is using port 3000.

**Windows:**

```powershell
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
npm run dev
```

**Mac:**

```bash
lsof -i :3000
kill -9 <PID>
npm run dev
```

### `pdflatex` / `DATABASE_URL` / Prisma errors

**Database error:**

```bash
npm run db:setup
```

Ensure `.env` exists with `DATABASE_URL="file:./dev.db"`.

**LaTeX report PDF** is separate — see `docs/batu-project-report/README.md`. Not required to run the app.

### Login fails or empty menu

```bash
npm run db:setup
```

Stop server (`Ctrl + C`), then:

```bash
npm run dev
```

### Chrome reloads endlessly on localhost

1. Close all `localhost:3000` tabs.
2. Open a new tab → http://localhost:3000
3. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac).
4. Or DevTools → Application → Clear site data.

Try **Brave** or **Safari** if Chrome still misbehaves.

### `npm install` fails on Mac (M1/M2/M3)

```bash
rm -rf node_modules package-lock.json
npm install
npm run db:setup
```

### Wrong folder / command not found

Always `cd` into the folder that contains `package.json` before running commands.

---

## Command reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server (port 3000) |
| `npm run db:setup` | Create DB + seed demo data |
| `npm run db:seed` | Reset demo data only |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |

### Push your own changes to GitHub

```powershell
cd "C:\Users\manoj\Desktop\Mini Project\canteen-preorder"
git status
git add .
git commit -m "feat: describe your change"
git pull origin main
git push origin main
```

---

## Setup checklist

- [ ] Node.js 18+ installed (`node -v`)
- [ ] Project cloned or extracted
- [ ] Terminal open in project folder
- [ ] `.env` created from `.env.example`
- [ ] `npm install` completed successfully
- [ ] `npm run db:setup` shows seed completed
- [ ] `npm run dev` shows `Ready`
- [ ] http://localhost:3000 opens
- [ ] Student login works
- [ ] Staff login works

---

## Files created on your machine

| File / folder | Purpose |
|---------------|---------|
| `.env` | Local config (never push to GitHub) |
| `prisma/dev.db` | SQLite database with demo data |
| `node_modules/` | Installed packages |
| `.next/` | Next.js cache (auto-generated) |

---

## Need help?

1. Read the **red error text** in the terminal.
2. Run `npm run db:setup` again.
3. Restart `npm run dev`.
4. Compare your steps with this guide.
5. Ask a teammate to verify Node version and `.env` contents.
