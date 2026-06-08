# BATU B.Tech Project Report — CampusCanteen

LaTeX report following **Department of Computer Engineering, BATU Lonere** PDF format.

## What is already written (you do NOT need to write chapters)

- Chapters 1--7 (Introduction through Conclusion)
- Abstract, Acknowledgements template
- Certificate text layout
- DFD, use case, class, ER, sequence (tabular), state diagrams (TikZ)
- Requirements tables, API tables, test cases
- Bibliography
- Appendix: demo logins, menu table, JSON samples

## Your details (already in `student-info.tex`)

| Field | Value |
|-------|--------|
| Name | Manoj Shivaji Pawar |
| Roll No. | 23030331245027 |
| Guide | Assistant Professor Uzma Munde |
| HOD | Dr. Arwind Kiweleker |
| Year / Date | 2025--26 / 08-05-2026 |

**Certificate examiners:** blank lines (fill by hand after viva).  
**Internship page:** not included.

## Still optional

| Item | Action |
|------|--------|
| Screenshots | Done — 8 PNGs in `images/`, `\hasimagestrue` enabled |
| BATU logo | `images/batu_logo.jpg` (title page) |

See **`FILL-REQUIRED.md`** for screenshot checklist.

## Screenshots to upload (Overleaf / `images/` folder)

Upload these **8 PNG files** into `docs/batu-project-report/images/` (exact names):

| # | Upload this file | Screen to capture |
|---|------------------|-------------------|
| 1 | `01-login.png` | Login page (`/login`) |
| 2 | `02-student-menu.png` | Student menu (home, Menu tab, mobile view) |
| 3 | `03-review-order.png` | Checkout — Review step |
| 4 | `04-payment.png` | Checkout — Payment step |
| 5 | `05-receipt-qr.png` | Receipt after payment (token + QR) |
| 6 | `06-student-orders.png` | Student — Orders tab |
| 7 | `07-staff-inventory.png` | Staff — Inventory (e.g. Samosa stock **Set to 17**) |
| 8 | `08-staff-verify.png` | Staff — Verify tab (QR / token) |

**Logo:** `images/batu_logo.jpg` on title page.

**After upload:** set `\hasimagestrue` in `student-info.tex`, recompile twice. Capture steps: **`images/README.md`**.

## Compile

**Overleaf:** Upload folder → main file `main.tex` → Recompile twice.

**Local:**
```bash
pdflatex main.tex
pdflatex main.tex
```

## Remove red [FILL] text

Replace every `\fillme{...}` in `student-info.tex` with your real text, e.g.:

```latex
\newcommand{\StudentName}{Rahul Kumar Sharma}
\newcommand{\RollNo}{TYCOCOMP2024001}
```

After correct filling, no red placeholders remain.

## File list

| File | Content |
|------|---------|
| `main.tex` | Document setup, includes chapters |
| `student-info.tex` | **YOUR details** |
| `frontmatter.tex` | Title, certificate, abstract |
| `chapter01`--`chapter07` | Main chapters |
| `bibliography.tex` | References |
| `appendix.tex` | Tests, screenshots |
| `FILL-REQUIRED.md` | Checklist |
