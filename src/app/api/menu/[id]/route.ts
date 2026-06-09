import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enrichMenuItem } from "@/lib/inventory";
import { updateMenuItemSchema } from "@/lib/menu-schema";
import { handleAuthError, jsonError } from "@/lib/api-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(["STAFF"]);
    const { id } = await params;
    const body = updateMenuItemSchema.parse(await request.json());

    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      return jsonError("Menu item not found.", 404);
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ item: enrichMenuItem(updated) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid input.");
    }
    return handleAuthError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(["STAFF"]);
    const { id } = await params;

    const existing = await prisma.menuItem.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    });
    if (!existing) {
      return jsonError("Menu item not found.", 404);
    }

    if (existing._count.orderItems > 0) {
      return jsonError(
        "Cannot delete this item — it appears in order history. Mark it sold out instead.",
        409
      );
    }

    await prisma.menuItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
