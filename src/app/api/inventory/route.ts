import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enrichMenuItem } from "@/lib/inventory";
import { handleAuthError, jsonError } from "@/lib/api-utils";

export async function GET() {
  try {
    await requireSession(["STAFF"]);
    const items = await prisma.menuItem.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ items: items.map(enrichMenuItem) });
  } catch (error) {
    return handleAuthError(error);
  }
}

const updateSchema = z.object({
  menuItemId: z.string(),
  stockQuantity: z.number().int().min(0).max(9999).optional(),
  addStock: z.number().int().min(0).max(9999).optional(),
  isAvailable: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    await requireSession(["STAFF"]);
    const body = updateSchema.parse(await request.json());

    const item = await prisma.menuItem.findUnique({
      where: { id: body.menuItemId },
    });
    if (!item) {
      return jsonError("Menu item not found.", 404);
    }

    let stockQuantity = item.stockQuantity;
    if (body.stockQuantity !== undefined) {
      stockQuantity = body.stockQuantity;
    } else if (body.addStock !== undefined) {
      stockQuantity += body.addStock;
    }

    const updated = await prisma.menuItem.update({
      where: { id: body.menuItemId },
      data: {
        stockQuantity,
        ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
      },
    });

    return NextResponse.json({ item: enrichMenuItem(updated) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid input.");
    }
    return handleAuthError(error);
  }
}
