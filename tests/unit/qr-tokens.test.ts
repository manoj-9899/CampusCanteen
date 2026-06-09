import { describe, expect, it } from "vitest";
import { parseQrPayload, verifyPayloadBody } from "@/lib/qr";
import {
  buildQrPayload,
  generatePickupSecret,
  pickupSecretsMatch,
} from "@/lib/tokens";

describe("QR v2 payload", () => {
  it("builds v2 payload when pickupSecret exists", () => {
    const secret = generatePickupSecret();
    const raw = buildQrPayload({
      id: "order-1",
      pickupSecret: secret,
      tokenNumber: "A1001",
      orderCode: "ORD-2026-1",
    });
    const parsed = JSON.parse(raw);
    expect(parsed.v).toBe(2);
    expect(parsed.orderId).toBe("order-1");
    expect(parsed.s).toBe(secret);
  });

  it("parses v2 QR payload", () => {
    const secret = generatePickupSecret();
    const payload = JSON.stringify({
      v: 2,
      orderId: "order-abc",
      s: secret,
    });
    const parsed = parseQrPayload(payload);
    expect(parsed?.orderId).toBe("order-abc");
    expect(parsed?.pickupSecret).toBe(secret);
    expect(verifyPayloadBody(parsed!)).toEqual({
      orderId: "order-abc",
      pickupSecret: secret,
    });
  });

  it("pickupSecretsMatch uses timing-safe comparison", () => {
    const secret = generatePickupSecret();
    expect(pickupSecretsMatch(secret, secret)).toBe(true);
    expect(pickupSecretsMatch(secret, secret + "x")).toBe(false);
    expect(pickupSecretsMatch(null, secret)).toBe(false);
  });
});
