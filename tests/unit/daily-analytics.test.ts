import { describe, expect, it, beforeEach } from "vitest";
import { getDailyAnalytics } from "@/lib/daily-analytics";
import {
  seedTestDatabase,
  seedTodayAnalyticsOrders,
} from "../setup/db";

describe("daily analytics", () => {
  beforeEach(async () => {
    const seed = await seedTestDatabase();
    await seedTodayAnalyticsOrders(
      seed.student.id,
      seed.menuItems.samosa.id,
      seed.menuItems.tea.id
    );
  });

  it("counts paid orders today", async () => {
    const analytics = await getDailyAnalytics(new Date());
    expect(analytics.ordersToday).toBe(2);
  });

  it("sums revenue from paid orders today", async () => {
    const analytics = await getDailyAnalytics(new Date());
    expect(analytics.revenueToday).toBe(80);
  });

  it("ranks top items by quantity sold today", async () => {
    const analytics = await getDailyAnalytics(new Date());
    expect(analytics.topItems.length).toBeGreaterThan(0);
    expect(analytics.topItems[0]?.name).toBe("Samosa");
    expect(analytics.topItems[0]?.quantitySold).toBe(3);
  });

  it("includes status breakdown for orders created today", async () => {
    const analytics = await getDailyAnalytics(new Date());
    const completed = analytics.ordersByStatus.find(
      (s) => s.status === "COMPLETED"
    );
    const confirmed = analytics.ordersByStatus.find(
      (s) => s.status === "CONFIRMED"
    );
    expect(completed?.count).toBe(1);
    expect(confirmed?.count).toBe(1);
  });
});
