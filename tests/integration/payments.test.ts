import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { POST as paymentsPost } from "@/app/api/payments/route";
import { GET as qrGet } from "@/app/api/orders/[id]/qr/route";
import { setSessionCookie } from "../helpers/auth";
import { jsonRequest, readJson } from "../helpers/request";
import { seedTestDatabase, getPrisma } from "../setup/db";
import { createPendingOrder } from "../helpers/orders";
import { PENDING_ORDER_TTL_MS } from "@/lib/pending-order";

function withPaymentMode<T>(mode: string | undefined, fn: () => Promise<T>) {
  const prev = process.env.TEST_PAYMENT_MODE;
  if (mode === undefined) {
    delete process.env.TEST_PAYMENT_MODE;
  } else {
    process.env.TEST_PAYMENT_MODE = mode;
  }
  return fn().finally(() => {
    if (prev === undefined) delete process.env.TEST_PAYMENT_MODE;
    else process.env.TEST_PAYMENT_MODE = prev;
  });
}

describe("POST /api/payments", () => {
  let seed: Awaited<ReturnType<typeof seedTestDatabase>>;

  beforeEach(async () => {
    seed = await seedTestDatabase();
    await setSessionCookie({
      id: seed.student.id,
      email: seed.student.email,
      name: "Rahul",
      role: "STUDENT",
      studentId: "CS2024001",
    });
  });

  afterEach(() => {
    delete process.env.TEST_PAYMENT_MODE;
  });

  async function pay(orderId: string, ip = "10.3.0.1") {
    return paymentsPost(
      jsonRequest("/api/payments", {
        method: "POST",
        body: JSON.stringify({ orderId, method: "UPI" }),
        ip,
      })
    );
  }

  it("confirms payment, deducts stock, and enables receipt QR", async () => {
    const order = await createPendingOrder(seed.student.id, [
      { menuItemId: seed.menuItems.samosa.id, quantity: 2, unitPrice: 20 },
    ]);

    const stockBefore = seed.menuItems.samosa.stockQuantity;

    const res = await withPaymentMode("success", () => pay(order.id));
    expect(res.status).toBe(200);

    const body = await readJson<{
      success: boolean;
      paymentRef: string;
      order: {
        status: string;
        paymentStatus: string;
        totalAmount: number;
        pickupSecret?: string;
      };
    }>(res);

    expect(body.success).toBe(true);
    expect(body.paymentRef).toMatch(/^PAY-/);
    expect(body.order.status).toBe("CONFIRMED");
    expect(body.order.paymentStatus).toBe("PAID");
    expect(body.order.totalAmount).toBe(40);
    expect(body.order.pickupSecret).toBeUndefined();

    const prisma = await getPrisma();
    const samosa = await prisma.menuItem.findUnique({
      where: { id: seed.menuItems.samosa.id },
    });
    expect(samosa?.stockQuantity).toBe(stockBefore - 2);

    const paid = await prisma.order.findUnique({ where: { id: order.id } });
    expect(paid?.pickupSecret).toBeTruthy();

    const qrRes = await qrGet(jsonRequest(`/api/orders/${order.id}/qr`), {
      params: Promise.resolve({ id: order.id }),
    });
    expect(qrRes.status).toBe(200);
    const qr = await readJson<{ qrDataUrl: string; payload: string }>(qrRes);
    expect(qr.qrDataUrl).toMatch(/^data:image/);
    expect(JSON.parse(qr.payload).v).toBe(2);

    await prisma.$disconnect();
  });

  it("marks payment failed without confirming order or changing stock", async () => {
    const order = await createPendingOrder(seed.student.id, [
      { menuItemId: seed.menuItems.tea.id, quantity: 1, unitPrice: 10 },
    ]);

    const res = await withPaymentMode("failure", () => pay(order.id, "10.3.0.2"));
    expect(res.status).toBe(402);

    const body = await readJson<{ success: boolean; error: string }>(res);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/declined/i);

    const prisma = await getPrisma();
    const updated = await prisma.order.findUnique({ where: { id: order.id } });
    expect(updated?.status).toBe("PENDING");
    expect(updated?.paymentStatus).toBe("FAILED");

    const tea = await prisma.menuItem.findUnique({
      where: { id: seed.menuItems.tea.id },
    });
    expect(tea?.stockQuantity).toBe(seed.menuItems.tea.stockQuantity);

    await prisma.$disconnect();
  });

  it("retains pending state on payment timeout", async () => {
    const order = await createPendingOrder(seed.student.id, [
      { menuItemId: seed.menuItems.samosa.id, quantity: 1, unitPrice: 20 },
    ]);

    const res = await withPaymentMode("timeout", () => pay(order.id, "10.3.0.3"));
    expect(res.status).toBe(408);

    const prisma = await getPrisma();
    const updated = await prisma.order.findUnique({ where: { id: order.id } });
    expect(updated?.status).toBe("PENDING");
    expect(updated?.paymentStatus).toBe("PENDING");

    await prisma.$disconnect();
  });

  it("rejects payment when stock changed during processing", async () => {
    const order = await createPendingOrder(seed.student.id, [
      { menuItemId: seed.menuItems.samosa.id, quantity: 3, unitPrice: 20 },
    ]);

    const res = await withPaymentMode("stock_changed", () =>
      pay(order.id, "10.3.0.4")
    );
    expect(res.status).toBe(409);

    const body = await readJson<{ error: string }>(res);
    expect(body.error).toMatch(/inventory changed/i);

    const prisma = await getPrisma();
    const updated = await prisma.order.findUnique({ where: { id: order.id } });
    expect(updated?.status).toBe("PENDING");
    expect(updated?.paymentStatus).toBe("PENDING");
    expect(
      (
        await prisma.menuItem.findUnique({
          where: { id: seed.menuItems.samosa.id },
        })
      )?.stockQuantity
    ).toBe(seed.menuItems.samosa.stockQuantity);

    await prisma.$disconnect();
  });

  it("rejects payment when stock is insufficient before gateway", async () => {
    const prisma = await getPrisma();
    await prisma.menuItem.update({
      where: { id: seed.menuItems.samosa.id },
      data: { stockQuantity: 1 },
    });
    await prisma.$disconnect();

    const order = await createPendingOrder(seed.student.id, [
      { menuItemId: seed.menuItems.samosa.id, quantity: 5, unitPrice: 20 },
    ]);

    const res = await withPaymentMode("success", () => pay(order.id, "10.3.0.5"));
    expect(res.status).toBe(409);

    const body = await readJson<{ success: boolean; errors: { message: string }[] }>(
      res
    );
    expect(body.success).toBe(false);
    expect(body.errors[0]?.message).toMatch(/only 1|unavailable/i);
  });

  it("rejects expired pending orders", async () => {
    const prisma = await getPrisma();
    const order = await prisma.order.create({
      data: {
        orderNumber: 9999,
        orderCode: "ORD-TEST-EXPIRED",
        tokenNumber: "A9999",
        userId: seed.student.id,
        status: "PENDING",
        paymentStatus: "PENDING",
        totalAmount: 20,
        createdAt: new Date(Date.now() - PENDING_ORDER_TTL_MS - 60_000),
        items: {
          create: [
            {
              menuItemId: seed.menuItems.samosa.id,
              quantity: 1,
              unitPrice: 20,
            },
          ],
        },
      },
    });
    await prisma.$disconnect();

    const res = await withPaymentMode("success", () => pay(order.id, "10.3.0.6"));
    expect(res.status).toBe(400);

    const body = await readJson<{ error: string }>(res);
    expect(body.error).toMatch(/expired/i);

    const prisma2 = await getPrisma();
    const cancelled = await prisma2.order.findUnique({ where: { id: order.id } });
    expect(cancelled?.status).toBe("CANCELLED");
    await prisma2.$disconnect();
  });

  it("rejects payment for already paid orders", async () => {
    const order = await createPendingOrder(seed.student.id, [
      { menuItemId: seed.menuItems.tea.id, quantity: 1, unitPrice: 10 },
    ]);

    await withPaymentMode("success", () => pay(order.id, "10.3.0.7"));

    const res = await withPaymentMode("success", () => pay(order.id, "10.3.0.8"));
    expect(res.status).toBe(400);
    const body = await readJson<{ error: string }>(res);
    expect(body.error).toMatch(/already paid/i);
  });
});
