import { endOfDay, format, startOfDay } from "date-fns";
import { prisma } from "./db";

export interface DailyAnalytics {
  date: string;
  ordersToday: number;
  revenueToday: number;
  ordersByStatus: { status: string; count: number }[];
  topItems: {
    menuItemId: string;
    name: string;
    imageEmoji: string;
    quantitySold: number;
  }[];
}

const STATUS_ORDER = [
  "PENDING",
  "CONFIRMED",
  "READY_FOR_PICKUP",
  "COLLECTED",
  "COMPLETED",
  "CANCELLED",
] as const;

/**
 * Daily sales snapshot for staff dashboard.
 *
 * Query design (3 parallel queries, uses @@index([createdAt, paymentStatus])):
 *
 * 1. aggregate — paid orders created today → ordersToday + revenueToday in one scan
 * 2. groupBy status — all orders created today → operational status breakdown
 * 3. groupBy menuItemId on OrderItem — paid today's orders → top sellers (take 5)
 */
export async function getDailyAnalytics(
  referenceDate: Date = new Date()
): Promise<DailyAnalytics> {
  const dayStart = startOfDay(referenceDate);
  const dayEnd = endOfDay(referenceDate);

  const todayRange = { gte: dayStart, lte: dayEnd };
  const paidTodayFilter = {
    createdAt: todayRange,
    paymentStatus: "PAID" as const,
  };

  const [salesAgg, statusGroups, itemGroups] = await Promise.all([
    prisma.order.aggregate({
      where: paidTodayFilter,
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: todayRange },
      _count: { id: true },
    }),
    prisma.orderItem.groupBy({
      by: ["menuItemId"],
      where: { order: paidTodayFilter },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const menuIds = itemGroups.map((g) => g.menuItemId);
  const menuItems =
    menuIds.length > 0
      ? await prisma.menuItem.findMany({
          where: { id: { in: menuIds } },
          select: { id: true, name: true, imageEmoji: true },
        })
      : [];

  const menuById = new Map(menuItems.map((m) => [m.id, m]));

  const ordersByStatus = statusGroups
    .map((g) => ({ status: g.status, count: g._count.id }))
    .sort((a, b) => {
      const ai = STATUS_ORDER.indexOf(a.status as (typeof STATUS_ORDER)[number]);
      const bi = STATUS_ORDER.indexOf(b.status as (typeof STATUS_ORDER)[number]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  const topItems = itemGroups.map((g) => {
    const menu = menuById.get(g.menuItemId);
    return {
      menuItemId: g.menuItemId,
      name: menu?.name ?? "Unknown item",
      imageEmoji: menu?.imageEmoji ?? "🍽️",
      quantitySold: g._sum.quantity ?? 0,
    };
  });

  return {
    date: format(referenceDate, "yyyy-MM-dd"),
    ordersToday: salesAgg._count.id,
    revenueToday: Math.round((salesAgg._sum.totalAmount ?? 0) * 100) / 100,
    ordersByStatus,
    topItems,
  };
}
