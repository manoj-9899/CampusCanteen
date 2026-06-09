import { describe, expect, it, beforeEach } from "vitest";
import { GET as qrGet } from "@/app/api/orders/[id]/qr/route";
import { POST as verifyPost } from "@/app/api/orders/verify/route";
import { setSessionCookie } from "../helpers/auth";
import { jsonRequest, readJson } from "../helpers/request";
import { seedTestDatabase } from "../setup/db";
import { createPaidOrder } from "../helpers/orders";
import { confirmStaffHandover } from "@/lib/order-lifecycle";
import { buildQrPayload } from "@/lib/tokens";
import { parseQrPayload, verifyPayloadBody } from "@/lib/qr";

describe("QR verification API", () => {
  let seed: Awaited<ReturnType<typeof seedTestDatabase>>;

  beforeEach(async () => {
    seed = await seedTestDatabase();
  });

  async function staffSession() {
    await setSessionCookie({
      id: seed.staff.id,
      email: seed.staff.email,
      name: "Priya",
      role: "STAFF",
    });
  }

  it("generates QR v2 payload for paid order", async () => {
    const order = await createPaidOrder(seed.student.id, [
      { menuItemId: seed.menuItems.samosa.id, quantity: 1, unitPrice: 20 },
    ]);
    await setSessionCookie({
      id: seed.student.id,
      email: seed.student.email,
      name: "Rahul",
      role: "STUDENT",
      studentId: "CS2024001",
    });
    const res = await qrGet(
      jsonRequest(`/api/orders/${order.id}/qr`),
      { params: Promise.resolve({ id: order.id }) }
    );
    expect(res.status).toBe(200);
    const body = await readJson<{ payload: string }>(res);
    const parsed = parseQrPayload(body.payload);
    expect(parsed?.pickupSecret).toBeTruthy();
    expect(JSON.parse(body.payload).v).toBe(2);
  });

  it("verifies valid pickup secret and marks ready", async () => {
    const order = await createPaidOrder(seed.student.id, [
      { menuItemId: seed.menuItems.samosa.id, quantity: 1, unitPrice: 20 },
    ]);
    await staffSession();
    const res = await verifyPost(
      jsonRequest("/api/orders/verify", {
        method: "POST",
        body: JSON.stringify({
          orderId: order.id,
          pickupSecret: order.pickupSecret,
        }),
        ip: "10.2.0.1",
      })
    );
    expect(res.status).toBe(200);
    const body = await readJson<{ order: { status: string } }>(res);
    expect(body.order.status).toBe("READY_FOR_PICKUP");
  });

  it("rejects invalid pickup secret", async () => {
    const order = await createPaidOrder(seed.student.id, [
      { menuItemId: seed.menuItems.samosa.id, quantity: 1, unitPrice: 20 },
    ]);
    await staffSession();
    const res = await verifyPost(
      jsonRequest("/api/orders/verify", {
        method: "POST",
        body: JSON.stringify({
          orderId: order.id,
          pickupSecret: "invalid-secret",
        }),
        ip: "10.2.0.2",
      })
    );
    expect(res.status).toBe(403);
  });

  it("rejects manual token when order requires pickup secret", async () => {
    const order = await createPaidOrder(seed.student.id, [
      { menuItemId: seed.menuItems.samosa.id, quantity: 1, unitPrice: 20 },
    ]);
    await staffSession();
    const res = await verifyPost(
      jsonRequest("/api/orders/verify", {
        method: "POST",
        body: JSON.stringify({ tokenNumber: order.tokenNumber }),
        ip: "10.2.0.3",
      })
    );
    expect(res.status).toBe(403);
  });

  it("rejects verify after order completed (reused secret)", async () => {
    const order = await createPaidOrder(
      seed.student.id,
      [{ menuItemId: seed.menuItems.samosa.id, quantity: 1, unitPrice: 20 }],
      "READY_FOR_PICKUP"
    );
    const secret = order.pickupSecret!;
    await confirmStaffHandover(order.id);
    await staffSession();
    const res = await verifyPost(
      jsonRequest("/api/orders/verify", {
        method: "POST",
        body: JSON.stringify({ orderId: order.id, pickupSecret: secret }),
        ip: "10.2.0.4",
      })
    );
    expect(res.status).toBe(400);
    const body = await readJson<{ error: string }>(res);
    expect(body.error).toContain("already collected");
  });

  it("parses scanned QR payload into verify body", () => {
    const order = {
      id: "cid",
      pickupSecret: "abc123",
      tokenNumber: "A1",
      orderCode: "ORD-1",
    };
    const raw = buildQrPayload(order);
    const payload = parseQrPayload(raw)!;
    expect(verifyPayloadBody(payload)).toEqual({
      orderId: "cid",
      pickupSecret: "abc123",
    });
  });
});
