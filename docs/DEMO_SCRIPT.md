# CampusCanteen Live Demo Script

> **Duration:** 8–12 minutes · **Version:** `v1.0.0-rc1`  
> **Setup:** Two browsers (student + staff) or phone + laptop. Use HTTPS Netlify URL for camera QR.

**Credentials:** `student@college.edu` / `student123` · `staff@canteen.edu` / `staff123`

---

## 1. Student login

**Show:** `/login` → sign in as student.

**Say:**  
*"Students authenticate with email and password. Sessions use HTTP-only JWT cookies — not localStorage — so tokens aren't accessible to JavaScript."*

---

## 2. Browse menu

**Show:** Category tabs, availability chips (Available / Only N Left / Sold out), Today's Special.

**Say:**  
*"The menu reflects live inventory. Students can't order sold-out items — Coffee is intentionally out of stock in the seed data. Stock updates when staff change inventory or when orders are paid."*

---

## 3. Add to cart

**Show:** Add Samosa (or Vada Pav) → cart count updates → desktop sidebar or mobile bottom bar.

**Say:**  
*"Quantity is capped by available stock. If an item sells out while browsing, the cart syncs on the next menu poll."*

---

## 4. Checkout — review

**Show:** Review order → line items and total.

**Say:**  
*"Before checkout, the client calls `/api/cart/validate` so we catch stock issues early — better UX than failing at payment."*

---

## 5. Checkout — confirm order

**Show:** Confirm order → payment step appears.

**Say:**  
*"This creates a PENDING order in the database. Stock is not deducted yet — only reserved conceptually until payment succeeds."*

---

## 6. Payment simulation

**Show:** Select UPI (or any method) → Pay → brief loading → success.

**Say:**  
*"RC1 uses simulated payments — no real money. In production this would integrate Razorpay. On success we atomically deduct stock, set status to CONFIRMED, and generate a pickup secret for QR security."*

*Optional dev note:* `TEST_PAYMENT_MODE=failure` for decline demo.

---

## 7. QR receipt

**Show:** Token number (e.g. A1050), order code, QR image, full-screen QR button.

**Say:**  
*"The student gets a pickup token and QR code. The QR embeds a server-generated secret — staff must scan or verify it; the token alone isn't enough for new orders."*

---

## 8. Staff queue

**Switch to staff browser:** Login → **Pickup queue** tab.

**Say:**  
*"Staff see paid orders in real time. Queue polls every five seconds when the tab is visible to save battery."*

**Show:** New order card with token, items, CONFIRMED status.

---

## 9. Verification

**Show:** Verify token tab → scan QR (camera or photo upload in E2E) or enter token.

**Say:**  
*"Verify checks the pickup secret, then moves the order to READY_FOR_PICKUP. Staff see item list to hand over the correct bag."*

**Show:** Success message + **Confirm pickup** button.

---

## 10. Completion

**Show:** Confirm handover → completed state. Switch to student — pickup confirmed notification.

**Say:**  
*"Handover is a separate step so staff confirm the food was physically given. Order ends in COMPLETED — terminal state."*

---

## 11. Dashboard (optional)

**Show:** Today's sales tab — revenue, order count, top items.

**Say:**  
*"Staff get same-day analytics from paid orders. Forecast tab uses a 14-day weighted average to suggest batch prep quantities."*

---

## 12. Inventory (optional)

**Show:** Inventory tab → restock, sold-out toggle.

**Say:**  
*"Cash counter sales aren't in the app — staff use Sold out when the physical tray is empty even if the number is wrong."*

---

## Closing line

*"CampusCanteen connects inventory, payments, and pickup verification in one loop — tested with 70 automated tests and a full Playwright checkout E2E. RC1 is demo-ready on Netlify; production would add real payments and migration-based schema management."*

---

## Troubleshooting during demo

| Issue | Fix |
|-------|-----|
| Camera won't open | Use HTTPS; allow camera permission |
| Order not in queue | Refresh; confirm payment succeeded |
| Verify fails on token only | Use QR — new orders require pickup secret |
| Session expired | Re-login after DB reset |
