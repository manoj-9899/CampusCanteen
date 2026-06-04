import { prisma } from "./db";
import { subDays, format, startOfDay, endOfDay } from "date-fns";

export interface ForecastItem {
  menuItemId: string;
  menuItemName: string;
  category: string;
  historicalAvg: number;
  predictedDemand: number;
  trend: "up" | "down" | "stable";
  currentStock: number;
  suggestedPrep: number;
}

export interface DailyForecast {
  date: string;
  totalPredictedOrders: number;
  totalPredictedRevenue: number;
  items: ForecastItem[];
}

function weightedMovingAverage(values: number[], weights?: number[]) {
  if (values.length === 0) return 0;
  const w = weights ?? values.map((_, i) => i + 1);
  const totalWeight = w.reduce((a, b) => a + b, 0);
  const weighted = values.reduce((sum, val, i) => sum + val * w[i], 0);
  return Math.round((weighted / totalWeight) * 10) / 10;
}

function computeTrend(recent: number[], older: number[]): "up" | "down" | "stable" {
  const recentAvg = recent.reduce((a, b) => a + b, 0) / (recent.length || 1);
  const olderAvg = older.reduce((a, b) => a + b, 0) / (older.length || 1);
  const diff = recentAvg - olderAvg;
  if (diff > 0.5) return "up";
  if (diff < -0.5) return "down";
  return "stable";
}

export async function generateDemandForecast(
  targetDate: Date = new Date()
): Promise<DailyForecast> {
  const lookbackDays = 14;
  const menuItems = await prisma.menuItem.findMany({
    orderBy: { category: "asc" },
  });

  const itemDailyCounts: Record<string, number[]> = {};
  const dailyOrderCounts: number[] = [];

  for (let i = lookbackDays; i >= 1; i--) {
    const dayStart = startOfDay(subDays(targetDate, i));
    const dayEnd = endOfDay(subDays(targetDate, i));

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: dayStart, lte: dayEnd },
        paymentStatus: "PAID",
        status: { not: "CANCELLED" },
      },
      include: { items: true },
    });

    dailyOrderCounts.push(orders.length);

    for (const item of menuItems) {
      if (!itemDailyCounts[item.id]) itemDailyCounts[item.id] = [];
      const qty = orders.reduce((sum, order) => {
        const match = order.items.find((oi) => oi.menuItemId === item.id);
        return sum + (match?.quantity ?? 0);
      }, 0);
      itemDailyCounts[item.id].push(qty);
    }
  }

  const totalPredictedOrders = Math.max(
    1,
    Math.round(weightedMovingAverage(dailyOrderCounts))
  );

  const items: ForecastItem[] = menuItems.map((item) => {
    const totals = itemDailyCounts[item.id] ?? [];
    const recent = totals.slice(-3);
    const older = totals.slice(-7, -3);
    const historicalAvg =
      totals.length > 0
        ? Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 10) / 10
        : 0;
    const predictedDemand = Math.max(0, Math.ceil(weightedMovingAverage(totals)));
    const suggestedPrep = Math.max(predictedDemand, Math.ceil(historicalAvg * 1.1));

    return {
      menuItemId: item.id,
      menuItemName: item.name,
      category: item.category,
      historicalAvg,
      predictedDemand,
      trend: computeTrend(recent, older.length ? older : [0]),
      currentStock: item.stockQuantity,
      suggestedPrep,
    };
  });

  const totalPredictedRevenue = items.reduce((sum, fi) => {
    const menuItem = menuItems.find((m) => m.id === fi.menuItemId);
    return sum + fi.predictedDemand * (menuItem?.price ?? 0);
  }, 0);

  return {
    date: format(targetDate, "yyyy-MM-dd"),
    totalPredictedOrders,
    totalPredictedRevenue: Math.round(totalPredictedRevenue * 100) / 100,
    items: items.sort((a, b) => b.predictedDemand - a.predictedDemand),
  };
}
