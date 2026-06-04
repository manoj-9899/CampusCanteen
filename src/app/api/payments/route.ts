import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateCartStock, deductStock } from "@/lib/inventory";
import { handleAuthError, jsonError } from "@/lib/api-utils";

const paymentSchema = z.object({
  orderId: z.string(),
  method: z
    .enum(["UPI", "GOOGLE_PAY", "PHONEPE", "PAYTM", "CARD"])
    .default("UPI"),
});

function generatePaymentRef() {
  return `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(["STUDENT"]);
    const { orderId, method } = paymentSchema.parse(await request.json());

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.userId !== session.id) {
      return jsonError("Order not found.", 404);
    }
    if (order.paymentStatus === "PAID") {
      return jsonError("This order is already paid.");
    }

    const cartLines = order.items.map((i) => ({
      menuItemId: i.menuItemId,
      quantity: i.quantity,
    }));

    const stockCheck = await validateCartStock(cartLines);
    if (!stockCheck.valid) {
      return NextResponse.json(
        { success: false, errors: stockCheck.errors },
        { status: 409 }
      );
    }

    // Brief simulated payment (shorter for slow mobile networks)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const paymentRef = generatePaymentRef();

    const updated = await prisma.$transaction(async (tx) => {
      const recheck = await validateCartStock(cartLines);
      if (!recheck.valid) {
        throw new Error("STOCK_CHANGED");
      }

      await deductStock(cartLines, tx);

      return tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          paymentRef,
          paymentMethod: method,
          status: "CONFIRMED",
        },
        include: {
          items: { include: { menuItem: true } },
        },
      });
    });

    return NextResponse.json({
      success: true,
      paymentRef,
      method,
      order: updated,
      message:
        "Your order has been confirmed. Please collect it from the pickup counter.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "STOCK_CHANGED") {
      return jsonError(
        "Inventory changed while processing payment. Please update your cart.",
        409
      );
    }
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid payment data.");
    }
    return handleAuthError(error);
  }
}
