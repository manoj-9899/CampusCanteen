import { generatePickupSecret } from "@/lib/tokens";
import { getPrisma } from "../setup/db";

export async function createPendingOrder(
  userId: string,
  items: { menuItemId: string; quantity: number; unitPrice: number }[]
) {
  const prisma = await getPrisma();
  const totalAmount = items.reduce(
    (s, i) => s + i.unitPrice * i.quantity,
    0
  );
  const orderNumber = 3000 + Math.floor(Math.random() * 9000);

  const order = await prisma.order.create({
    data: {
      orderNumber,
      orderCode: `ORD-TEST-${orderNumber}`,
      tokenNumber: `A${orderNumber}`,
      userId,
      status: "PENDING",
      paymentStatus: "PENDING",
      totalAmount,
      items: { create: items },
    },
    include: { items: true },
  });

  await prisma.$disconnect();
  return order;
}

export async function createPaidOrder(
  userId: string,
  items: { menuItemId: string; quantity: number; unitPrice: number }[],
  status: "CONFIRMED" | "READY_FOR_PICKUP" = "CONFIRMED"
) {
  const prisma = await getPrisma();
  const totalAmount = items.reduce(
    (s, i) => s + i.unitPrice * i.quantity,
    0
  );
  const orderNumber = 4000 + Math.floor(Math.random() * 9000);
  const pickupSecret = generatePickupSecret();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      orderCode: `ORD-PAID-${orderNumber}`,
      tokenNumber: `A${orderNumber}`,
      userId,
      status,
      paymentStatus: "PAID",
      paymentRef: `PAY-${orderNumber}`,
      paymentMethod: "UPI",
      totalAmount,
      pickupSecret,
      items: { create: items },
    },
    include: { items: true, user: true },
  });

  await prisma.$disconnect();
  return order;
}
