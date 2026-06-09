import { describe, expect, it } from "vitest";
import {
  isPendingOrderExpired,
  PENDING_ORDER_TTL_MS,
} from "@/lib/pending-order";

describe("pending order expiry", () => {
  it("returns false for fresh orders", () => {
    const created = new Date();
    expect(isPendingOrderExpired(created)).toBe(false);
  });

  it("returns true after TTL elapsed", () => {
    const created = new Date(Date.now() - PENDING_ORDER_TTL_MS - 1000);
    expect(isPendingOrderExpired(created)).toBe(true);
  });

  it("accepts ISO string createdAt", () => {
    const created = new Date(
      Date.now() - PENDING_ORDER_TTL_MS - 5000
    ).toISOString();
    expect(isPendingOrderExpired(created)).toBe(true);
  });
});
