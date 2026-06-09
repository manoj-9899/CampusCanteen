import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  confirmStaffHandover,
  lifecycleErrorMessage,
} from "@/lib/order-lifecycle";
import { stripPickupSecret } from "@/lib/order-response";
import { handleAuthError, jsonError } from "@/lib/api-utils";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(["STAFF"]);
    const { id } = await params;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return jsonError("Order not found.", 404);
    }

    if (order.paymentStatus !== "PAID") {
      return jsonError("Payment not completed for this order.", 400);
    }

    if (order.status === "COMPLETED") {
      return jsonError("This order is already completed.", 400);
    }

    if (order.status === "CANCELLED") {
      return jsonError("This order was cancelled.", 400);
    }

    try {
      const updated = await confirmStaffHandover(id);
      return NextResponse.json({
        success: true,
        message: "Pickup confirmed. Order completed.",
        order: stripPickupSecret(updated),
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "INVALID_TRANSITION") {
          return jsonError(
            "Order must be verified and marked ready for pickup before confirming handover.",
            400
          );
        }
        if (error.message === "NOT_FOUND") {
          return jsonError(lifecycleErrorMessage("NOT_FOUND"), 404);
        }
      }
      throw error;
    }
  } catch (error) {
    return handleAuthError(error);
  }
}
