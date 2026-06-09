import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  applyStaffStatusUpdate,
  expireStalePendingOrders,
  lifecycleErrorMessage,
} from "@/lib/order-lifecycle";
import { stripPickupSecret } from "@/lib/order-response";
import { handleAuthError, jsonError } from "@/lib/api-utils";

const statusSchema = z.object({
  status: z.enum(["READY_FOR_PICKUP", "COLLECTED", "COMPLETED", "CANCELLED"]),
});

const orderInclude = {
  items: { include: { menuItem: true } },
  user: { select: { name: true, studentId: true } },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    if (session.role === "STUDENT") {
      await expireStalePendingOrders(session.id);
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) {
      return jsonError("Order not found.", 404);
    }

    if (session.role === "STUDENT" && order.userId !== session.id) {
      return jsonError("Forbidden.", 403);
    }

    return NextResponse.json({ order: stripPickupSecret(order) });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(["STAFF"]);
    const { id } = await params;
    const { status } = statusSchema.parse(await request.json());

    try {
      const updated = await applyStaffStatusUpdate(id, status);
      return NextResponse.json({ order: stripPickupSecret(updated) });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "NOT_FOUND") {
          return jsonError(lifecycleErrorMessage("NOT_FOUND"), 404);
        }
        if (error.message === "INVALID_TRANSITION") {
          return jsonError(lifecycleErrorMessage("INVALID_TRANSITION"), 400);
        }
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid status.");
    }
    return handleAuthError(error);
  }
}
