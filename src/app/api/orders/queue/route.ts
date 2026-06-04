import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleAuthError } from "@/lib/api-utils";

export async function GET() {
  try {
    await requireSession(["STAFF"]);

    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
        status: { in: ["CONFIRMED", "READY_FOR_PICKUP"] },
      },
      include: {
        user: { select: { name: true, studentId: true } },
        items: { include: { menuItem: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    return handleAuthError(error);
  }
}
