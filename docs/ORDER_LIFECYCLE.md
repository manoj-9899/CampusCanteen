# Order Lifecycle Rules

> **Source of truth:** `src/lib/order-lifecycle.ts`  
> **Sprint 8:** All staff status changes route through `applyStaffStatusUpdate()` or `confirmStaffHandover()`.

## Two status fields

| Field | Enum values | Purpose |
| ----- | ----------- | ------- |
| `Order.status` | `PENDING`, `CONFIRMED`, `READY_FOR_PICKUP`, `COLLECTED`, `COMPLETED`, `CANCELLED` | Kitchen / pickup progress |
| `Order.paymentStatus` | `PENDING`, `PAID`, `FAILED`, `REFUNDED` | Payment state |

`FAILED` (payment) is set when simulated/declined payment fails (`TEST_PAYMENT_MODE=failure`, Sprint 10); order stays `PENDING` for retry. `REFUNDED` is set when a **paid** order is cancelled by the student.

---

## Order status transition matrix

| From | To | Allowed | Actor | Stock | Payment change |
| ---- | -- | ------- | ----- | ----- | -------------- |
| *(create)* | `PENDING` | ✅ | Student checkout | — | `PENDING` |
| `PENDING` | `CONFIRMED` | ✅ | Payment success | **Deduct** | `PENDING` → `PAID` |
| `PENDING` | `CANCELLED` | ✅ | Student cancel / **15 min expiry** | — | stays `PENDING` |
| `CONFIRMED` | `READY_FOR_PICKUP` | ✅ | Staff mark ready / QR verify | — | `PAID` |
| `CONFIRMED` | `CANCELLED` | ✅ | **Student cancel only** | **Restore** | `PAID` → `REFUNDED` |
| `READY_FOR_PICKUP` | `COMPLETED` | ✅ | Staff confirm handover | — | `PAID` |
| `READY_FOR_PICKUP` | `COLLECTED` | ✅ | Staff PATCH (legacy) | — | `PAID` |
| `COLLECTED` | `COMPLETED` | ✅ | Staff PATCH (legacy) | — | `PAID` |
| `READY_FOR_PICKUP` | `CANCELLED` | ❌ | — | — | — |
| `COMPLETED` | *any* | ❌ | Final | — | `PAID` |
| `CANCELLED` | *any* | ❌ | Final | — | varies |

**Staff routes:**

| Route | Transition | Validator |
| ----- | ---------- | --------- |
| `PATCH /api/orders/[id]` | Any allowed staff transition | `applyStaffStatusUpdate()` |
| `POST /api/orders/verify` | `CONFIRMED` → `READY_FOR_PICKUP` | `applyStaffStatusUpdate()` |
| `POST /api/orders/[id]/confirm-handover` | `READY_FOR_PICKUP` → `COMPLETED` only | `confirmStaffHandover()` |

`COMPLETED` is **not** reachable from `CONFIRMED` without passing through `READY_FOR_PICKUP`.

---

## Student cancellation rules

| Order status | Can cancel? | Effect |
| ------------ | ----------- | ------ |
| `PENDING` (unpaid) | ✅ Yes | `CANCELLED`, no stock change |
| `CONFIRMED` (paid) | ✅ Yes | `CANCELLED`, stock restored, `REFUNDED` |
| `READY_FOR_PICKUP` | ❌ No | Food may already be packed |
| `COMPLETED` | ❌ No | Final |
| `CANCELLED` | ❌ No | Final |

API: `POST /api/orders/[id]/cancel` (student session required).

---

## Orphan unpaid orders (15-minute expiry)

**Strategy:** Lazy expiration on API + client polling sync.

1. Server: `expireStalePendingOrders(userId)` on student order/payment routes.
2. Client: `useStudentApp` detects expired/cancelled `pendingOrder` during 5s order poll.
3. Payment on expired order returns: *"This order expired. Please place a new order."*

---

## Inventory

| Event | Stock |
| ----- | ----- |
| Payment success | `deductStock()` in transaction |
| Paid cancel (`CONFIRMED` → `CANCELLED`) | `restoreStock()` in same transaction |
| Unpaid cancel / expiry | No change |

---

## QR workflow

- QR generated only for **paid** orders (`GET /api/orders/[id]/qr`).
- v2 payload includes per-order `pickupSecret` (see `docs/QR_PICKUP_SECURITY.md`).
- Staff verify (`POST /api/orders/verify`) requires matching secret for new orders; rate-limited.
- Pickup completion via `POST /api/orders/[id]/confirm-handover` — **requires `READY_FOR_PICKUP`**.
