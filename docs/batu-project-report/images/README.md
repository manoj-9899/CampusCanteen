# UI screenshots for the BATU project report

Save **PNG** files here with the exact names below. Figures appear in **Chapter 6** (like numbered figures in your guide’s report) and in the **List of Figures**.

## Before you capture

1. Start database (if using Docker): `npm run db:local:up` from project root.
2. Seed data: `npm run db:setup`
3. Run app: `npm run dev` → open **http://localhost:3000**

## Demo logins

| Role    | Email                 | Password   |
|---------|-----------------------|------------|
| Student | student@college.edu   | student123 |
| Staff   | staff@canteen.edu     | staff123   |

## File names (required)

| File | What to capture |
|------|-----------------|
| `01-login.png` | `/login` — full page |
| `02-student-menu.png` | Student home — menu tab, mobile width |
| `03-review-order.png` | Checkout **Review** step |
| `04-payment.png` | Checkout **Payment** step |
| `05-receipt-qr.png` | After pay — token + QR receipt |
| `06-student-orders.png` | Bottom nav **Orders** tab |
| `07-staff-inventory.png` | **Inventory** — use **Set to** → `17` on Samosa (or similar) |
| `08-staff-verify.png` | **Verify** tab (scanner UI or manual token entry) |

## How to capture (recommended)

### Phone (best for report — shows real mobile UI)

1. On PC, run `npm run dev` (already binds `0.0.0.0`).
2. Find PC IP: `ipconfig` → use IPv4 (e.g. `192.168.1.5`).
3. On phone (same Wi‑Fi): `http://<PC-IP>:3000`
4. Take screenshots with the phone; transfer PNGs to this folder and rename.

### Desktop (Chrome)

1. Open the page (e.g. login).
2. **F12** → toggle device toolbar (**Ctrl+Shift+M**).
3. Device: **iPhone 12 Pro** or **Pixel 7**, zoom 100%.
4. **Ctrl+Shift+P** → type `screenshot` → **Capture screenshot** (not “full size” if it adds extra chrome).

### Staff inventory figure (`07`)

1. Login as staff.
2. Inventory → Samosa → **Set to** → enter `17` → save.
3. Screenshot showing **17** in stock (proves custom inventory).

### Receipt figure (`06`)

1. Login as student → add items → review → pay (demo payment).
2. Screenshot receipt with **token** (e.g. A154) and **QR**.

## Enable figures in the PDF

Edit `../student-info.tex`:

```latex
\hasimagesfalse   % change to:
\hasimagestrue
```

Recompile:

```bash
cd docs/batu-project-report
pdflatex main.tex
pdflatex main.tex
```

## Optional

- `batu_logo.jpg` — BATU logo on title page
- `11-register.png` — only if you add an extra figure in `screenshots.tex`

## Tips

- Use **portrait** screenshots; width in LaTeX is `0.85\textwidth`.
- Hide personal notifications / battery if possible.
- Same theme (light mode) across all shots for a uniform report.
