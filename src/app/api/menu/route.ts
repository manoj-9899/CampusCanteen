import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enrichMenuItem } from "@/lib/inventory";

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
