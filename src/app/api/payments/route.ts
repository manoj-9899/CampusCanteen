import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateCartStock, deductStock } from "@/lib/inventory";
import {
  expireStalePendingOrders,
  isPendingOrderExpired,
  lifecycleErrorMessage,
} from "@/lib/order-lifecycle";
import { stripPickupSecret } from "@/lib/order-response";
import { generatePickupSecret } from "@/lib/tokens";
import { enforceRateLimit, handleAuthError, jsonError } from "@/lib/api-utils";
import {
  RATE_LIMITS,
  checkRateLimit,
  rateLimitKey,
} from "@/lib/rate-limit";
import {
  PaymentSimulationTimeoutError,
  isPaymentSimulationEnabled,
  simulatePaymentGateway,
} from "@/lib/payment-simulation";

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

    const limited = enforceRateLimit(
      checkRateLimit(
        rateLimitKey("payments:create", session.id),
        RATE_LIMITS.paymentsCreate.limit,
        RATE_LIMITS.paymentsCreate.windowMs
      )
    );
    if (limited) return limited;

    const { orderId, method } = paymentSchema.parse(await request.json());

    await expireStalePendingOrders(session.id);

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
    if (order.status === "CANCELLED") {
      return jsonError(lifecycleErrorMessage("EXPIRED"));
    }
    if (
      order.status === "PENDING" &&
      order.paymentStatus === "PENDING" &&
      isPendingOrderExpired(order.createdAt)
    ) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
      return jsonError(lifecycleErrorMessage("EXPIRED"));
    }
    if (order.status !== "PENDING") {
      return jsonError("This order cannot be paid.");
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

    let simOutcome: Awaited<ReturnType<typeof simulatePaymentGateway>> = "success";
    try {
      if (isPaymentSimulationEnabled()) {
        simOutcome = await simulatePaymentGateway();
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      if (error instanceof PaymentSimulationTimeoutError) {
        return jsonError(
          "Payment timed out. Your order is still pending — please try again.",
          408
        );
      }
      throw error;
    }

    if (simOutcome === "failure") {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "FAILED" },
      });
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment was declined. Please try again or choose another method.",
        },
        { status: 402 }
      );
    }

    const paymentRef = generatePaymentRef();

    const updated = await prisma.$transaction(async (tx) => {
      if (simOutcome === "stock_changed") {
        throw new Error("STOCK_CHANGED");
      }

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
          pickupSecret: generatePickupSecret(),
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
      order: stripPickupSecret(updated),
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
