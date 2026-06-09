import { describe, expect, it, beforeEach } from "vitest";
import {
  RATE_LIMITS,
  checkRateLimit,
  rateLimitKey,
  resetRateLimitStore,
} from "@/lib/rate-limit";

describe("rate limiter", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("allows requests under the limit", () => {
    const key = rateLimitKey("test:bucket", "user-1");
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5, 60_000).allowed).toBe(true);
    }
  });

  it("blocks requests over the limit", () => {
    const key = rateLimitKey("test:bucket", "user-2");
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 60_000);
    }
    const blocked = checkRateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
  });

  it("uses distinct keys for verify preset", () => {
    const a = rateLimitKey("orders:verify", "staff-a");
    const b = rateLimitKey("orders:verify", "staff-b");
    expect(a).not.toBe(b);
    expect(RATE_LIMITS.ordersVerify.limit).toBe(40);
  });
});
