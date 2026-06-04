import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
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

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: "COMPLETED",
        collectedAt: new Date(),
      },
      include: {
        user: { select: { name: true, studentId: true } },
        items: { include: { menuItem: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pickup confirmed. Order completed.",
      order: updated,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
