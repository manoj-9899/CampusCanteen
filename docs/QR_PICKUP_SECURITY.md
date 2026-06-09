# QR Pickup Security (Sprint 8)

## Threat model

| Threat | Actor | Impact |
| ------ | ----- | ------ |
| Token guessing | Anyone with staff access or leaked session | Wrong pickup / fraud |
| QR replay | Staff re-scans same receipt | Mitigated by status checks (`COMPLETED` blocked) |
| Manual token bypass | Staff enters sequential token | Skips physical QR possession proof |
| Verify brute force | Staff session + automated guesses | Enumerate active orders |

## Previous weaknesses

- `tokenNumber` (`A1001`, `A1002`, …) and `orderCode` (`ORD-2026-N`) are sequential and guessable.
- QR payload was static JSON `{ orderId, tokenNumber, orderCode }` with no secret.
- `POST /api/orders/verify` accepted token/orderCode alone with no rate limit.

## Implemented architecture (low complexity)

| Control | Detail |
| ------- | ------ |
| **Pickup secret** | 32-byte hex `pickupSecret` generated on payment success |
| **QR v2 payload** | `{ "v": 2, "orderId": "…", "s": "<secret>" }` |
| **Verify rule** | Orders with `pickupSecret` require matching `s` in verify body |
| **Manual entry** | Legacy orders (no secret) still accept token/code; new orders require QR scan |
| **Secret lifecycle** | Cleared when order reaches `COMPLETED` |
| **Rate limit** | `POST /api/orders/verify` — 40 requests / 15 min per staff user |
| **API exposure** | `pickupSecret` never returned in order JSON; only embedded in QR payload server-side |

## Migration

1. Deploy schema with nullable `pickupSecret`.
2. New paid orders receive a secret automatically.
3. Existing paid orders without secret continue manual token verify until naturally completed.
4. Students refresh receipt QR after payment to get v2 payload.

No HMAC/JWT in v1 — avoids shared signing keys and clock skew; 256-bit random secret per order is sufficient for campus scale.
