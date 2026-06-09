import { randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "./db";

export async function generateOrderIdentifiers() {
  const year = new Date().getFullYear();
  const lastOrder = await prisma.order.findFirst({
    orderBy: { orderNumber: "desc" },
  });
  const orderNumber = (lastOrder?.orderNumber ?? 1000) + 1;
  const seq = orderNumber - 1000;
  const orderCode = `ORD-${year}-${seq}`;
  const tokenNumber = `A${orderNumber}`;
  return { orderNumber, orderCode, tokenNumber };
}

/** Cryptographic pickup secret — required for QR verify on new paid orders. */
export function generatePickupSecret(): string {
  return randomBytes(32).toString("hex");
}

export function pickupSecretsMatch(
  expected: string | null | undefined,
  provided: string | undefined
): boolean {
  if (!expected || !provided) return false;
  if (expected.length !== provided.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}

export function buildQrPayload(order: {
  id: string;
  pickupSecret: string | null;
  tokenNumber: string;
  orderCode: string;
}) {
  if (order.pickupSecret) {
    return JSON.stringify({
      v: 2,
      orderId: order.id,
      s: order.pickupSecret,
    });
  }
  return JSON.stringify({
    orderId: order.id,
    tokenNumber: order.tokenNumber,
    orderCode: order.orderCode,
  });
}
