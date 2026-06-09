import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  applyStaffStatusUpdate,
  lifecycleErrorMessage,
} from "@/lib/order-lifecycle";
import { stripPickupSecret } from "@/lib/order-response";
import { enforceRateLimit, handleAuthError, jsonError } from "@/lib/api-utils";
import {
  RATE_LIMITS,
  checkRateLimit,
  rateLimitKey,
} from "@/lib/rate-limit";
import { pickupSecretsMatch } from "@/lib/tokens";

const schema = z.object({
  tokenNumber: z.string().min(1).optional(),
  orderCode: z.string().min(1).optional(),
  orderId: z.string().min(1).optional(),
  pickupSecret: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(["STAFF"]);

    const limited = enforceRateLimit(
      checkRateLimit(
        rateLimitKey("orders:verify", session.id),
        RATE_LIMITS.ordersVerify.limit,
        RATE_LIMITS.ordersVerify.windowMs
      )
    );
    if (limited) return limited;

    const body = schema.parse(await request.json());

    if (
      !body.tokenNumber &&
      !body.orderCode &&
      !body.orderId &&
      !body.pickupSecret
    ) {
      return jsonError("Provide token number, order ID, or scan QR code.");
    }

    const order = await prisma.order.findFirst({
      where: body.orderId
        ? { id: body.orderId }
        : body.tokenNumber
          ? { tokenNumber: body.tokenNumber.toUpperCase() }
          : { orderCode: body.orderCode!.toUpperCase() },
      include: {
        user: { select: { name: true, studentId: true } },
        items: { include: { menuItem: true } },
      },
    });

    if (!order) {
      return jsonError("Order not found. Check the token or order ID.", 404);
    }

    if (order.pickupSecret) {
      if (!pickupSecretsMatch(order.pickupSecret, body.pickupSecret)) {
        return jsonError(
          "Invalid or missing pickup verification. Scan the student's receipt QR code.",
          403
        );
      }
    }

    if (order.paymentStatus !== "PAID") {
      return jsonError("Payment not completed for this order.", 400);
    }

    if (order.status === "COMPLETED") {
      return jsonError("This order was already collected and completed.", 400);
    }

    if (order.status === "CANCELLED") {
      return jsonError("This order was cancelled.", 400);
    }

    let updated = order;
    if (order.status === "CONFIRMED") {
      try {
        updated = await applyStaffStatusUpdate(order.id, "READY_FOR_PICKUP");
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "INVALID_TRANSITION") {
            return jsonError(lifecycleErrorMessage("INVALID_TRANSITION"), 400);
          }
          if (error.message === "NOT_FOUND") {
            return jsonError(lifecycleErrorMessage("NOT_FOUND"), 404);
          }
        }
        throw error;
      }
    }

    return NextResponse.json({
      valid: true,
      needsHandoverConfirm: true,
      message:
        "Order verified. Hand over the items to the student, then tap Confirm pickup.",
      order: stripPickupSecret(updated),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid input.");
    }
    return handleAuthError(error);
  }
}
