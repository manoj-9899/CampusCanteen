# What YOU must fill before submitting the report

All project technical content is already written in the LaTeX files.  
Only **personal / official / visual** items need your input.

## Step 1 — Edit one file (`student-info.tex`)

**Filled for Manoj Shivaji Pawar (23030331245027).** Still to do:

| Item | Status |
|------|--------|
| Personal details in `student-info.tex` | Done |
| Certificate examiners | Blank lines (sign after viva) |
| Internship page | Not included |
| Screenshots + `\hasimagestrue` | Done |

## Step 2 — Screenshots (Chapter 6) — completed

All 8 PNGs are in `images/`. `\hasimagestrue` is set in `student-info.tex`. Recompile the report **twice** on Overleaf (or local `pdflatex`) to refresh Chapter 6 figures and the List of Figures.

## Step 3 — BATU logo (optional)

BATU logo: `images/batu_logo.jpg` (shown on title page).

## Step 4 — Print / bind

- Certificate & examiner lines: sign **after** viva.
- Binding: A4, Times 12pt, 1.5 spacing, black cover, gold lettering (per department).

## Already filled (do not rewrite unless wrong)

- All chapters 1--7 technical content
- Abstract, literature, requirements, design diagrams (TikZ)
- API tables, test cases, demo credentials
- Bibliography entries

## Compile

```bash
cd docs/batu-project-report
pdflatex main.tex
pdflatex main.tex
```

Or upload folder to **Overleaf**, main file `main.tex`.
