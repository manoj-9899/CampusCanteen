import type { CartItem, MenuItem } from "@/types";

export interface CartSyncResult {
  cart: CartItem[];
  removed: string[];
  reduced: { name: string; from: number; to: number }[];
}

/** Drop sold-out items and cap quantities when menu changes (e.g. staff toggle). */
export function reconcileCartWithMenu(
  cart: CartItem[],
  menu: MenuItem[]
): CartSyncResult {
  const removed: string[] = [];
  const reduced: CartSyncResult["reduced"] = [];
  const next: CartItem[] = [];

  for (const line of cart) {
    const item = menu.find((m) => m.id === line.menuItemId);
    if (!item || !item.canOrder) {
      removed.push(line.name);
      continue;
    }

    const maxQuantity = item.stockQuantity;
    const quantity = Math.min(line.quantity, maxQuantity);

    if (quantity < line.quantity) {
      reduced.push({ name: line.name, from: line.quantity, to: quantity });
    }
    if (quantity < 1) {
      removed.push(line.name);
      continue;
    }

    next.push({
      ...line,
      quantity,
      maxQuantity,
      price: item.price,
    });
  }

  return { cart: next, removed, reduced };
}

export function cartSyncMessage(result: CartSyncResult): string | null {
  const parts: string[] = [];
  if (result.removed.length) {
    parts.push(
      `${result.removed.join(", ")} ${result.removed.length === 1 ? "was" : "were"} removed — staff marked ${result.removed.length === 1 ? "it" : "them"} sold out`
    );
  }
  for (const r of result.reduced) {
    parts.push(`${r.name} reduced to ${r.to} (only ${r.to} left)`);
  }
  return parts.length ? parts.join(". ") + "." : null;
}
