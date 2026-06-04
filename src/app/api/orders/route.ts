import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateCartStock } from "@/lib/inventory";
import { generateOrderIdentifiers } from "@/lib/tokens";
import { handleAuthError, jsonError } from "@/lib/api-utils";

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1),
});

const orderInclude = {
  items: { include: { menuItem: true } },
  user: { select: { name: true, studentId: true } },
};

export async function GET() {
  try {
    const session = await requireSession();
    const where =
      session.role === "STAFF"
        ? {
            paymentStatus: "PAID" as const,
            status: { notIn: ["CANCELLED" as const, "PENDING" as const] },
          }
        : { userId: session.id };

    const orders = await prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      take: session.role === "STAFF" ? 100 : 30,
    });

    return NextResponse.json({ orders });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(["STUDENT"]);
    const body = createOrderSchema.parse(await request.json());

    const stockCheck = await validateCartStock(body.items);
    if (!stockCheck.valid) {
      return NextResponse.json(
        { valid: false, errors: stockCheck.errors },
        { status: 409 }
      );
    }

    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: body.items.map((i) => i.menuItemId) } },
    });

    let totalAmount = 0;
    const orderItems = body.items.map((line) => {
      const menuItem = menuItems.find((m) => m.id === line.menuItemId)!;
      totalAmount += menuItem.price * line.quantity;
      return {
        menuItemId: line.menuItemId,
        quantity: line.quantity,
        unitPrice: menuItem.price,
      };
    });

    const { orderNumber, orderCode, tokenNumber } = await generateOrderIdentifiers();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        orderCode,
        tokenNumber,
        userId: session.id,
        totalAmount,
        status: "PENDING",
        paymentStatus: "PENDING",
        items: { create: orderItems },
      },
      include: orderInclude,
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid order data.");
    }
    return handleAuthError(error);
  }
}
