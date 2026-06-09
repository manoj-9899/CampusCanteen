# Database Health Review

> **Sprint 3** — audit of `prisma/schema.prisma`. No UI changes.

## 1. Schema audit summary

### Unique constraints (existing)

| Model | Field(s) | Status |
| ----- | -------- | ------ |
| `User` | `email` | ✅ `@unique` — login lookup |
| `Order` | `orderCode`, `tokenNumber`, `orderNumber` | ✅ — pickup / verify identifiers |
| `User` | `studentId` | ⚠️ was optional, non-unique → **Sprint 3: `@unique`** |

### Foreign keys

| Relation | onDelete | Assessment |
| -------- | -------- | ------------ |
| `Order` → `User` | RESTRICT (default) | ✅ Cannot delete user with orders |
| `OrderItem` → `Order` | `Cascade` | ✅ Order delete removes line items |
| `OrderItem` → `MenuItem` | RESTRICT (default) | ✅ Preserves order history if item removed |

### Indexes before Sprint 3

| Model | Index | Used by |
| ----- | ----- | ------- |
| `MenuItem` | `[isDailySpecial]` | Menu `orderBy` (marginal at current menu size) |

**Gaps:** No indexes on `Order.userId`, `Order.status`, `Order.createdAt`, or `OrderItem` FK columns.

---

## 2. User table

### `email`

- `@unique` constraint enforced.
- Login: `findUnique({ where: { email } })` — optimal.

### `studentId` strategy

| Aspect | Before | After Sprint 3 |
| ------ | ------ | -------------- |
| Required | No (optional) | Still optional |
| Unique | No — duplicates allowed | **`@unique`** when set |
| Validation | None | Empty string → `null`; duplicate rejected at register |
| Staff lookup | Display on order cards | Same; IDs now trustworthy when provided |

**Recommendation:** **`studentId` should be unique** when provided.

- Prevents two accounts claiming the same college ID.
- PostgreSQL/SQLite allow **multiple `NULL`** values on a unique nullable column.
- Does **not** replace college registry verification (future sprint).

**Not recommended now:** `@unique` on `email` domain or composite `(role, email)` — unnecessary.

---

## 3. Order table — index recommendations

Indexes are **compound**, driven by actual `findMany` / `updateMany` patterns — not three redundant single-column indexes.

| Index | Query pattern | Source |
| ----- | ------------- | ------ |
| `[userId, createdAt]` | Student order history: `where: { userId }`, `orderBy: { createdAt: 'desc' }`, `take: 30` | `GET /api/orders` (student) |
| `[paymentStatus, status, createdAt]` | Staff queue: `PAID` + `status IN (CONFIRMED, READY)` + `orderBy createdAt asc` | `GET /api/orders/queue` |
| | Staff order list: `PAID` + `status notIn (...)` + `orderBy createdAt desc` | `GET /api/orders` (staff) |
| | Orphan expiry: `PENDING` + `PENDING` + `createdAt < cutoff` | `expireStalePendingOrders()` |
| `[createdAt, paymentStatus]` | Forecast: date range on `createdAt` + `paymentStatus: PAID` | `lib/forecast.ts` (14-day loop) |

**Not added:** Standalone `status` or `userId` indexes — covered by compounds above.

---

## 4. MenuItem table — index recommendations

| Candidate | Verdict | Reason |
| --------- | ------- | ------ |
| `category` | **Skip** | No `WHERE category = ?` in APIs; client filters in memory; full menu &lt; 50 rows |
| `isAvailable` | **Skip** | No DB filter on availability; `enrichMenuItem()` computes labels in app |
| `isDailySpecial` | **Keep** | Existing index; used in `orderBy` |

**Revisit when:** Menu CRUD, server-side category filter, or catalog &gt; ~200 items.

---

## 5. OrderItem — FK indexes

| Index | Reason |
| ----- | ------ |
| `[orderId]` | Every order load includes `items`; PostgreSQL does not auto-index FKs |
| `[menuItemId]` | Forecast aggregates quantities per menu item |

---

## 6. Concurrent stock handling

### Current deduction process

```
1. POST /api/orders     → validateCartStock() [read only, no lock]
2. POST /api/payments   → validateCartStock() [read]
                        → $transaction:
                            → validateCartStock() [re-read]
                            → deductStock() [atomic decrement per line]
                            → order → PAID + CONFIRMED
3. deductStock()        → UPDATE stockQuantity = stockQuantity - qty
                        → throws if result < 0
```

Stock is deducted **only on successful payment**, not on order creation.

### Can overselling occur?

| Scenario | Risk | Mitigation today |
| -------- | ---- | ---------------- |
| Two students pay concurrently for last unit | **Low** | Transaction + recheck + decrement; one payment gets 409 / `STOCK_CHANGED` |
| Two unpaid PENDING orders for last unit | **Yes (soft)** | Both created; only first payment succeeds — acceptable for campus scale |
| Cancel restores stock then immediate repay race | **Low** | Each payment in its own transaction with recheck |
| Staff manual stock edit during payment | **Low** | Recheck inside transaction |

**Hard overselling** (selling more than `stockQuantity` as PAID) is **prevented** by decrement + negative check inside the payment transaction.

### Are reservations needed?

| Approach | Pros | Cons |
| -------- | ---- | ---- |
| **Current (deduct on pay)** | Simple; no orphan reservations | Unpaid carts don't hold stock |
| **Reserve on order create** | Holds stock for 15 min TTL | Needs `reservedQuantity` column + release on expiry/cancel; more complex |

**Recommendation:** **Reservations not required** for current campus deployment. Revisit if unpaid-PENDING abandonment causes frequent payment failures at peak lunch hour.

---

## 7. Migration plan

This project uses **`prisma db push`** (no `prisma/migrations` folder).

### Step 1 — Review changes

Schema files updated in lockstep:

- `prisma/schema.prisma` (SQLite local)
- `prisma/schema.postgresql.prisma` (Neon production)

### Step 2 — Local (SQLite)

```bash
npm run db:push
```

If duplicate `studentId` values exist locally, push fails — resolve manually or reseed:

```bash
npm run db:setup
```

### Step 3 — Production (Neon)

```bash
npm run db:push:neon
```

Indexes are created online; no data migration script required.

### Step 4 — Verify

```bash
npm run build
```

### Rollback

Revert schema files and `db push` again. Removing `@unique` from `studentId` restores prior behavior.

---

## 8. Sprint 3 schema diff

```diff
 model User {
-  studentId String?
+  studentId String? @unique
 }

 model Order {
   ...
+  @@index([userId, createdAt])
+  @@index([paymentStatus, status, createdAt])
+  @@index([createdAt, paymentStatus])
 }

 model OrderItem {
   ...
+  @@index([orderId])
+  @@index([menuItemId])
 }
```

**Application change:** `POST /api/auth` normalizes empty `studentId` to `null` and rejects duplicates.
