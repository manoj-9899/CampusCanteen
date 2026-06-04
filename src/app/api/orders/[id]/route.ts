import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
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

    return NextResponse.json({ order });
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

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return jsonError("Order not found.", 404);
    }

    const data: { status: typeof status; collectedAt?: Date } = { status };
    if (status === "COLLECTED") {
      data.collectedAt = new Date();
    }

    const updated = await prisma.order.update({
      where: { id },
      data,
      include: {
        user: { select: { name: true, studentId: true } },
        items: { include: { menuItem: true } },
      },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid status.");
    }
    return handleAuthError(error);
  }
}
