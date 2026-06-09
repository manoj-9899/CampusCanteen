import { prisma } from "./db";

export type StockStatus = "available" | "low" | "out";

export function getStockStatus(
  stockQuantity: number,
  lowStockThreshold: number
): StockStatus {
  if (stockQuantity <= 0) return "out";
  if (stockQuantity <= lowStockThreshold) return "low";
  return "available";
}

export function getAvailabilityLabel(
  stockQuantity: number,
  lowStockThreshold: number,
  isAvailable = true
): string {
  if (!isAvailable) return "Sold out";
  const status = getStockStatus(stockQuantity, lowStockThreshold);
  if (status === "out") return "Out of Stock";
  if (status === "low") return `Only ${stockQuantity} Left`;
  return "Available";
}

export function canOrderItem(
  stockQuantity: number,
  isAvailable: boolean
): boolean {
  return isAvailable && stockQuantity > 0;
}

export function enrichMenuItem<
  T extends {
    stockQuantity: number;
    lowStockThreshold: number;
    isAvailable: boolean;
  },
>(item: T) {
  const stockStatus = getStockStatus(item.stockQuantity, item.lowStockThreshold);
  return {
    ...item,
    stockStatus,
    availabilityLabel: getAvailabilityLabel(
      item.stockQuantity,
      item.lowStockThreshold,
      item.isAvailable
    ),
    canOrder: canOrderItem(item.stockQuantity, item.isAvailable),
  };
}

export interface CartLine {
  menuItemId: string;
  quantity: number;
}

export interface StockValidationError {
  menuItemId: string;
  name: string;
  requested: number;
  available: number;
  message: string;
}

export async function validateCartStock(
  items: CartLine[]
): Promise<{ valid: boolean; errors: StockValidationError[] }> {
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map((i) => i.menuItemId) } },
  });

  const errors: StockValidationError[] = [];

  for (const line of items) {
    const item = menuItems.find((m) => m.id === line.menuItemId);
    if (!item) {
      errors.push({
        menuItemId: line.menuItemId,
        name: "Unknown item",
        requested: line.quantity,
        available: 0,
        message: "Item is no longer on the menu.",
      });
      continue;
    }
    if (!item.isAvailable) {
      errors.push({
        menuItemId: item.id,
        name: item.name,
        requested: line.quantity,
        available: 0,
        message: `Sorry, ${item.name} is sold out. Staff has closed online ordering for this item.`,
      });
      continue;
    }
    if (item.stockQuantity < line.quantity) {
      const msg =
        item.stockQuantity === 0
          ? `Sorry, ${item.name} is currently unavailable. Please update your cart.`
          : `Sorry, only ${item.stockQuantity} ${item.name} left. Please update your cart.`;
      errors.push({
        menuItemId: item.id,
        name: item.name,
        requested: line.quantity,
        available: item.stockQuantity,
        message: msg,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

type DbClient = Pick<typeof prisma, "menuItem">;

export async function deductStock(items: CartLine[], db: DbClient = prisma) {
  for (const line of items) {
    const updated = await db.menuItem.update({
      where: { id: line.menuItemId },
      data: { stockQuantity: { decrement: line.quantity } },
    });
    if (updated.stockQuantity < 0) {
      throw new Error(`INSUFFICIENT_STOCK:${line.menuItemId}`);
    }
  }
}

export async function restoreStock(items: CartLine[], db: DbClient = prisma) {
  for (const line of items) {
    await db.menuItem.update({
      where: { id: line.menuItemId },
      data: { stockQuantity: { increment: line.quantity } },
    });
  }
}
