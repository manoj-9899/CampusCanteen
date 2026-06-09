import { describe, expect, it, beforeEach } from "vitest";
import {
  canOrderItem,
  deductStock,
  enrichMenuItem,
  restoreStock,
  validateCartStock,
} from "@/lib/inventory";
import { seedTestDatabase } from "../setup/db";
import { getPrisma } from "../setup/db";

describe("inventory", () => {
  let samosaId: string;
  let coffeeId: string;

  beforeEach(async () => {
    const seed = await seedTestDatabase();
    samosaId = seed.menuItems.samosa.id;
    coffeeId = seed.menuItems.coffee.id;
  });

  it("enrichMenuItem marks unavailable items as not orderable", () => {
    const enriched = enrichMenuItem({
      stockQuantity: 0,
      lowStockThreshold: 5,
      isAvailable: false,
    });
    expect(enriched.canOrder).toBe(false);
    expect(enriched.availabilityLabel).toBe("Sold out");
  });

  it("validateCartStock rejects sold-out items", async () => {
    const result = await validateCartStock([
      { menuItemId: coffeeId, quantity: 1 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.name).toBe("Coffee");
  });

  it("deductStock reduces quantity", async () => {
    const prisma = await getPrisma();
    await deductStock([{ menuItemId: samosaId, quantity: 3 }], prisma);
    const item = await prisma.menuItem.findUnique({
      where: { id: samosaId },
    });
    expect(item?.stockQuantity).toBe(22);
    await prisma.$disconnect();
  });

  it("deductStock throws when stock would go negative", async () => {
    const prisma = await getPrisma();
    await expect(
      deductStock([{ menuItemId: samosaId, quantity: 100 }], prisma)
    ).rejects.toThrow(/INSUFFICIENT_STOCK/);
    await prisma.$disconnect();
  });

  it("restoreStock increments quantity after cancel", async () => {
    const prisma = await getPrisma();
    await deductStock([{ menuItemId: samosaId, quantity: 2 }], prisma);
    await restoreStock([{ menuItemId: samosaId, quantity: 2 }], prisma);
    const item = await prisma.menuItem.findUnique({
      where: { id: samosaId },
    });
    expect(item?.stockQuantity).toBe(25);
    await prisma.$disconnect();
  });

  it("canOrderItem requires availability and positive stock", () => {
    expect(canOrderItem(10, true)).toBe(true);
    expect(canOrderItem(0, true)).toBe(false);
    expect(canOrderItem(10, false)).toBe(false);
  });
});
