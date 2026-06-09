import type { MenuItem } from "@/types";

export type LowStockSeverity = "low" | "out";

export interface LowStockAlertItem {
  id: string;
  name: string;
  imageEmoji: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  severity: LowStockSeverity;
  message: string;
}

/** Items staff should act on: out of stock, sold out online, or below threshold. */
export function getLowStockAlerts(items: MenuItem[]): LowStockAlertItem[] {
  return items
    .map((item): LowStockAlertItem | null => {
      if (!item.isAvailable) {
        return {
          id: item.id,
          name: item.name,
          imageEmoji: item.imageEmoji,
          stockQuantity: item.stockQuantity,
          lowStockThreshold: item.lowStockThreshold,
          isAvailable: false,
          severity: "out",
          message: "Marked sold out for online orders",
        };
      }
      if (item.stockQuantity <= 0) {
        return {
          id: item.id,
          name: item.name,
          imageEmoji: item.imageEmoji,
          stockQuantity: item.stockQuantity,
          lowStockThreshold: item.lowStockThreshold,
          isAvailable: true,
          severity: "out",
          message: "No stock left",
        };
      }
      if (item.stockQuantity <= item.lowStockThreshold) {
        return {
          id: item.id,
          name: item.name,
          imageEmoji: item.imageEmoji,
          stockQuantity: item.stockQuantity,
          lowStockThreshold: item.lowStockThreshold,
          isAvailable: true,
          severity: "low",
          message: `Only ${item.stockQuantity} left (alert at ≤${item.lowStockThreshold})`,
        };
      }
      return null;
    })
    .filter((item): item is LowStockAlertItem => item !== null)
    .sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "out" ? -1 : 1;
      return a.stockQuantity - b.stockQuantity;
    });
}
