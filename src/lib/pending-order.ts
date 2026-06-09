/** Unpaid checkout orders older than this are auto-cancelled. */
export const PENDING_ORDER_TTL_MS = 15 * 60 * 1000;

export const PENDING_ORDER_EXPIRED_MESSAGE =
  "This order expired. Please place a new order.";

export function isPendingOrderExpired(
  createdAt: Date | string,
  now: Date = new Date()
): boolean {
  const created =
    typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  return now.getTime() - created.getTime() > PENDING_ORDER_TTL_MS;
}
