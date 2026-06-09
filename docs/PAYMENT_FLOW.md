# Payment Flow Audit (Sprint 10)

> **Endpoint:** `POST /api/payments` (`src/app/api/payments/route.ts`)  
> **Related:** `POST /api/cart/validate`, `POST /api/orders`, `POST /api/orders/[id]/cancel`

## Current flow

```mermaid
sequenceDiagram
  participant S as Student client
  participant P as POST /api/payments
  participant DB as Database
  participant Sim as Payment sim (dev/test)

  S->>P: { orderId, method }
  P->>P: requireSession(STUDENT) + rate limit
  P->>DB: expireStalePendingOrders(userId)
  P->>DB: load order + items
  alt invalid order
    P-->>S: 404 / 400 / expired message
  end
  P->>DB: validateCartStock (pre-check)
  alt stock invalid
    P-->>S: 409 + errors
  end
  P->>Sim: simulatePaymentGateway()
  alt timeout (TEST_PAYMENT_MODE=timeout)
    P-->>S: 408, order unchanged
  else failure (TEST_PAYMENT_MODE=failure)
    P->>DB: paymentStatus FAILED
    P-->>S: 402, status stays PENDING
  else success path
    P->>DB: transaction: recheck stock, deductStock, PAID+CONFIRMED
    P-->>S: 200 + receipt order (no pickupSecret)
  end
```

### Preconditions

| Check | Response |
| ----- | -------- |
| Not logged in | 401 |
| Wrong user / missing order | 404 |
| Already `PAID` | 400 |
| `CANCELLED` | 400 (expired message) |
| Pending > 15 min | Auto-cancel + 400 expired |
| `status !== PENDING` | 400 cannot be paid |
| Stock invalid (pre-check) | 409 + `errors[]` |

### Success path

1. Simulated gateway returns success (default).
2. Transaction re-validates stock, deducts inventory, updates order:
   - `paymentStatus` → `PAID`
   - `status` → `CONFIRMED`
   - `pickupSecret` generated
   - `paymentRef` + `paymentMethod` set
3. Response: `{ success: true, paymentRef, order, message }`

### Failure path (Sprint 10)

When `TEST_PAYMENT_MODE=failure` (dev/test only):

- `paymentStatus` → `FAILED`
- `status` remains `PENDING`
- Stock **not** deducted
- Response: `402` with `{ success: false, error }`
- Student may retry payment (route allows `FAILED` + `PENDING`)

### Expiry path

Handled **before** payment attempt:

- `expireStalePendingOrders()` on each payment request
- Orders with `PENDING` + `paymentStatus PENDING` older than 15 minutes → `CANCELLED`
- Payment on expired order returns lifecycle expired message

Cancellation is separate: `POST /api/orders/[id]/cancel` (student, while `PENDING`).

### Timeout path (Sprint 10)

When `TEST_PAYMENT_MODE=timeout` (dev/test only):

- No database mutation
- Response: `408` — order stays `PENDING` / `paymentStatus PENDING`

### Stock-changed path

| When | Behaviour |
| ---- | --------- |
| Pre-check fails | 409 before gateway sim |
| Race during transaction | 409 `"Inventory changed while processing payment…"` |
| `TEST_PAYMENT_MODE=stock_changed` | Forces transaction failure (409) after pre-check passes |

## Payment state diagram

```mermaid
stateDiagram-v2
  [*] --> PENDING_UNPAID: POST /api/orders

  PENDING_UNPAID --> CONFIRMED_PAID: payment success
  PENDING_UNPAID --> PENDING_FAILED: payment failure (sim)
  PENDING_FAILED --> CONFIRMED_PAID: payment retry success
  PENDING_UNPAID --> CANCELLED: student cancel / 15m expiry
  PENDING_FAILED --> CANCELLED: student cancel / expiry

  CONFIRMED_PAID --> READY: staff verify / mark ready
  READY --> COMPLETED: staff confirm handover
  CONFIRMED_PAID --> CANCELLED_REFUNDED: student cancel (stock restored)

  note right of PENDING_UNPAID
    status=PENDING
    paymentStatus=PENDING
  end note

  note right of PENDING_FAILED
    status=PENDING
    paymentStatus=FAILED
  end note

  note right of CONFIRMED_PAID
    status=CONFIRMED
    paymentStatus=PAID
    stock deducted
  end note
```

## Inventory impact

| Event | Stock |
| ----- | ----- |
| Order created (`PENDING`) | No change |
| Payment success | `deductStock()` per line item |
| Payment failure / timeout | No change |
| Pre-check or race 409 | No change |
| Paid student cancel | `restoreStock()` |
| Unpaid cancel / expiry | No change (never deducted) |

## Missing states (before Sprint 10)

| State | Issue |
| ----- | ----- |
| `paymentStatus: FAILED` | Enum existed; never written |
| Timeout / abandoned payment | No distinct status; order stays pending |
| Payment in progress | No `PROCESSING` lock (double-pay race possible) |
| Idempotent retry key | No `Idempotency-Key` header |

## Missing validations (before Sprint 10)

| Gap | Risk |
| --- | ---- |
| No real gateway signature / webhook | Production payments blocked by design |
| No price re-check at payment | Price frozen at order create (`unitPrice` on lines) — acceptable |
| `FAILED` not surfaced in UI | Client shows generic error only |
| No payment attempt audit log | Harder ops debugging |
| Concurrent duplicate POST /api/payments | Second call may 400 "already paid" after first succeeds — OK |

## Simulation (dev/test only)

```bash
# Default — success after ~500ms (25ms in Vitest)
TEST_PAYMENT_MODE=success

# Decline — FAILED, order stays pending
TEST_PAYMENT_MODE=failure

# Gateway timeout — 408, no DB change
TEST_PAYMENT_MODE=timeout

# Simulated inventory race — 409 after pre-check
TEST_PAYMENT_MODE=stock_changed
```

**Production:** `NODE_ENV=production` ignores `TEST_PAYMENT_MODE`; behaviour is always success simulation (until Razorpay).
