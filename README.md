# CampusCanteen — Smart Inventory-Aware Ordering

A web application for **ready-to-eat college canteen food**. Students order only **in-stock items**, pay online, and collect using a **token number + QR code**. Staff manage a **pickup queue**, **verify tokens**, and view **demand forecasts** to reduce waste.

## User flow (summary)

1. Student browses menu with live availability (Available / Only N Left / Sold out)
2. Adds items to cart (quantity capped by app-tracked stock)
3. Reviews order summary → system validates inventory
4. Pays via UPI / Google Pay / PhonePe / Paytm / Card (simulated)
5. Stock is **deducted** after payment; **token** (e.g. `A154`) and **QR** generated
6. Order appears on staff pickup queue
7. Staff packs order → marks ready → verifies token/QR at counter → marks collected

**Cash counter sales** are not tracked in the app. Staff use **Inventory → Sold out / Available** to stop or resume online ordering when an item finishes (even if the stock number is wrong).

### Student UX (web)

- Category filters, bottom cart bar (mobile), checkout step bar, active-order banner
- Full-screen QR on receipt, browser notifications when order is ready
- Collapsible **How it works** guide on the menu page

### Mobile-first & PWA (no native Android app)

- Responsive layout, safe areas, 44px touch targets, offline banner
- API timeouts, visibility-aware polling (saves battery on slow phones)
- **Install on phone:** Menu or Profile shows install help — Chrome **Install** button (HTTPS) or **Add to Home screen** steps (iOS Safari / Android menu)
- `manifest.webmanifest` + service worker for home-screen launch and staff shortcut to `/staff`
- Full audit notes: [docs/MOBILE_AUDIT.md](docs/MOBILE_AUDIT.md)

### Staff custom inventory

On **Staff → Inventory**, for each item:

- **Add** — type any amount (e.g. `30`) or use **+10 / +25** shortcuts
- **Set to** — set exact app stock (e.g. `12` samosas left after counting)
- **Online / Sold out** toggle — stop or allow online orders (cash sales are not auto-tracked)

## Quick start (local demo)

**Full setup for Windows & Mac:** see **[SETUP.md](SETUP.md)** (share with your project partner).

Uses **SQLite** — one file in `prisma/dev.db`, no Docker or database server.

```bash
cd canteen-preorder
copy .env.example .env
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Deploy online (Vercel)

Full guide: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — GitHub → Vercel → Postgres → env vars → seed once.

### Test on phone + laptop (same Wi‑Fi)

The dev server listens on all network interfaces. After `npm run dev`:

1. Find your laptop IP: `ipconfig` → **IPv4 Address** (e.g. `10.135.242.210`)
2. On your **phone browser**, open: `http://YOUR_LAPTOP_IP:3000`
3. **Student flow** on phone → place order → show QR on receipt
4. **Staff flow** on laptop or second phone → `http://YOUR_LAPTOP_IP:3000/staff` → Verify → Scan QR

If the phone shows a blank page or never finishes loading, **restart** `npm run dev` after pulling updates — Next.js must allow your laptop IP for LAN access (configured in `next.config.ts`).

If the phone cannot connect at all, allow **Node.js** through Windows Firewall for port **3000**.

**Restart** the dev server after pulling changes (`Ctrl+C`, then `npm run dev` again).


| Role    | Email                 | Password    |
|---------|-----------------------|-------------|
| Student | student@college.edu   | student123  |
| Staff   | staff@canteen.edu     | staff123    |

### Demo menu (seeded)

| Item       | Price | Stock note        |
|------------|-------|-------------------|
| Samosa     | ₹20   | Available (25)    |
| Vada Pav   | ₹25   | Available (30)    |
| Poha       | ₹30   | Available (20)    |
| Tea        | ₹10   | Available (50)    |
| Coffee     | ₹15   | **Out of stock**  |
| Misal Pav  | ₹60   | **Today's Special** — Only 5 left |

## Tech stack

- Next.js 16 · TypeScript · Tailwind CSS
- Prisma · SQLite (local file database)
- JWT session cookies
- QR codes (`qrcode` package)
- Recharts (staff demand forecast)

## API highlights

| Endpoint | Purpose |
|----------|---------|
| `GET /api/menu` | Menu + stock status + daily special |
| `POST /api/cart/validate` | Pre-payment stock check |
| `POST /api/orders` | Create pending order |
| `POST /api/payments` | Pay, deduct stock, confirm + token |
| `GET /api/orders/[id]/qr` | QR code for pickup |
| `GET /api/orders/queue` | Staff pickup queue |
| `POST /api/orders/verify` | Staff verify by token, order ID, or scanned QR |
| `PATCH /api/inventory` | Staff restock items or toggle **Sold out / Available** |
| `GET /api/forecast` | Demand forecast for batch prep |

## Order status flow

```
PENDING → (payment) → CONFIRMED → READY_FOR_PICKUP → (verify QR/token) → (confirm handover) → COMPLETED
```

## Mini project notes

- **Problem:** Ordering/payment queues + overselling when stock is batch-prepared
- **Solution:** Inventory-aware ordering, digital tokens, pickup-only counter visit
- **Forecast:** Weighted moving average on 14 days of sales to suggest batch sizes
# CampusCanteen
