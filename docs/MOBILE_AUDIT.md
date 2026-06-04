# CampusCanteen — Mobile-First Audit

Audit date: 2026. Scope: student/staff web app on phones (low-end Android, older iPhone, slow networks).

## Prioritized improvements (by impact)

| Rank | Issue | User impact | Status |
|------|--------|-------------|--------|
| P0 | No viewport / safe-area / iOS input zoom | Broken layout, zoom on focus, notch overlap | **Fixed** |
| P0 | Aggressive polling when tab hidden | Battery drain, slow network load | **Fixed** |
| P0 | No offline / timeout handling | Silent failures on 2G | **Fixed** |
| P1 | Cart below fold on mobile | Hard to checkout | **Fixed** (A1 bottom bar) |
| P1 | Small touch targets (cart +/-) | Mis-taps | **Fixed** |
| P1 | No PWA manifest | No home-screen install | **Fixed** |
| P2 | 1s artificial payment delay | Slow checkout | **Reduced** (500ms) |
| P2 | Menu refetch without cache | Extra data on slow networks | **Fixed** (8s cache) |
| P2 | QR scanner landscape overflow | Cropped camera | **Fixed** (CSS) |
| P3 | SQLite at scale | Lock under hundreds of users | **Resolved** — PostgreSQL for local + Vercel |
| P3 | Open staff registration | Abuse risk | Not changed (demo) |
| P3 | Full offline ordering | Needs service worker + sync | Partial (SW shell only) |

---

## Implemented in this pass

### Mobile foundation
- `viewport` export: `device-width`, `viewport-fit: cover`, theme color
- Safe-area padding on body, navbar, bottom cart bar
- `overflow-x: hidden`, `100dvh`, 16px form inputs (prevents iOS zoom)
- `.touch-target` / `.touch-target-sm`, `touch-action: manipulation`
- `prefers-reduced-motion` respected

### Network & errors
- `src/lib/fetch-client.ts` — 20s timeout, offline detection, structured `ApiError` with 409 body
- `NetworkStatusBanner` when offline
- Student/staff/receipt flows use `fetchJson`

### Performance
- `useVisibilityPolling` — polls only when tab is visible; catch-up on focus
- Student: menu poll 5s (when cart/checkout), orders poll 5s
- Staff queue poll 5s (visible only)
- Menu API: `Cache-Control: private, max-age=8`

### PWA
- `public/manifest.webmanifest` + SVG icons
- `public/sw.js` — network-first, no API cache
- `PwaRegister` (production only)
- Apple web app metadata

### UX (existing A/B features retained)
- Bottom cart, step bar, category filters, full-screen QR, notifications, how-it-works

---

## Phase 3 — PWA & checkout polish (2026)

- **PWA install banner** (Chrome/Android `beforeinstallprompt`) on student menu
- **iOS install hint** on Profile tab (Share → Add to Home Screen)
- **Service worker v2** — caches `/`, `/login`, manifest; offline navigation fallback
- **Manifest shortcuts** — Order food, Staff counter
- **Mobile cart sheet** — View cart opens bottom sheet to edit items before review
- **Compact checkout stepper** — “Step 2 of 4 · Review” on mobile
- **Orange mobile header** — matches redesign; slim global navbar on student home
- **Active order banner** — visible on Menu/Orders tabs (not only during checkout)

---

## Custom stock & PWA install (2026)

- **Inventory:** staff can **Add** any quantity, **Set to** exact count, quick +10/+25
- **PwaInstallPanel:** Chrome install prompt, iOS Share steps, Android manual steps on HTTP/LAN
- **Installed state:** green “Running as installed app” when launched from home screen
- Service worker registers in dev and production (install still needs HTTPS for one-tap prompt)

---

## Phase 4 — Visual polish & touch targets (2026)

- **`StatusChip`** — shared chips for stock (Available / Low / Sold out), order status, specials
- **Menu rows** — 44px +/- buttons; sold-out rows show chips and disabled add control
- **Compact notification banner** on mobile menu (redesign alert style)
- **Staff orange mobile header** + slim navbar on `/staff`
- **`StaffQueueSummary`** — preparing / ready counts + scrollable token strip
- **`StaffQueueOrderCard`** — status chips + full-width ready button
- **Verify tab** — larger inputs/buttons, QR placeholder with icon

---

## Remaining recommendations (future)

1. **Database**: Use managed Postgres backups on Neon/Vercel for production data safety.
2. **Rate limiting**: API routes behind middleware (e.g. 60 req/min per IP).
3. **Staff signup**: Restrict `@canteen.edu` or invite-only.
4. **Image CDN**: If real food photos added, use WebP + `next/image`.
5. **Push**: Web Push API with VAPID for reliable “order ready” on iOS 16.4+.
6. **E2E tests**: Playwright on 320px viewport + slow 3G throttling.

---

## How to test on mobile

1. Chrome DevTools → device toolbar → iPhone SE / Galaxy S8
2. Network → Slow 3G while placing order
3. Application → Manifest → installability
4. Toggle offline → banner appears; actions show clear errors
5. Background tab 1 min → return → single catch-up poll (not burst)
