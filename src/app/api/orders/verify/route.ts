import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleAuthError, jsonError } from "@/lib/api-utils";

const schema = z.object({
  tokenNumber: z.string().min(1).optional(),
  orderCode: z.string().min(1).optional(),
  orderId: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireSession(["STAFF"]);
    const body = schema.parse(await request.json());

    if (!body.tokenNumber && !body.orderCode && !body.orderId) {
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

    if (order.paymentStatus !== "PAID") {
      return jsonError("Payment not completed for this order.", 400);
    }

    if (order.status === "COMPLETED") {
      return jsonError("This order was already collected and completed.", 400);
    }

    if (order.status === "CANCELLED") {
      return jsonError("This order was cancelled.", 400);
    }

    // Mark verified — ready for handover (do not complete until staff confirms)
    const updated =
      order.status === "CONFIRMED"
        ? await prisma.order.update({
            where: { id: order.id },
            data: { status: "READY_FOR_PICKUP" },
            include: {
              user: { select: { name: true, studentId: true } },
              items: { include: { menuItem: true } },
            },
          })
        : order;

    return NextResponse.json({
      valid: true,
      needsHandoverConfirm: true,
      message:
        "Order verified. Hand over the items to the student, then tap Confirm pickup.",
      order: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid input.");
    }
    return handleAuthError(error);
  }
}
