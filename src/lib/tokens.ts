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

export function buildQrPayload(orderId: string, tokenNumber: string, orderCode: string) {
  return JSON.stringify({ orderId, tokenNumber, orderCode });
}
