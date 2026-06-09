import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enrichMenuItem } from "@/lib/inventory";
import { createMenuItemSchema } from "@/lib/menu-schema";
import { handleAuthError, jsonError } from "@/lib/api-utils";

export async function GET() {
  const items = await prisma.menuItem.findMany({
    orderBy: [{ isDailySpecial: "desc" }, { category: "asc" }, { name: "asc" }],
  });

  const enriched = items.map(enrichMenuItem);

  const dailySpecial = enriched.find((i) => i.isDailySpecial) ?? null;

  return NextResponse.json(
    { items: enriched, dailySpecial },
    {
      headers: {
        "Cache-Control": "private, max-age=8, stale-while-revalidate=15",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    await requireSession(["STAFF"]);
    const body = createMenuItemSchema.parse(await request.json());

    const item = await prisma.menuItem.create({
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        category: body.category,
        imageEmoji: body.imageEmoji,
        isAvailable: body.isAvailable,
        stockQuantity: body.stockQuantity,
      },
    });

    return NextResponse.json(
      { item: enrichMenuItem(item) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid input.");
    }
    return handleAuthError(error);
  }
}
