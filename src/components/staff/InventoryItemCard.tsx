"use client";

import { StatusChip } from "@/components/ui/StatusChip";
import { InventoryStockControls } from "./InventoryStockControls";
import type { MenuItem } from "@/types";

export function InventoryItemCard({
  item,
  busy,
  onToggleAvailability,
  onAddStock,
  onSetStock,
}: {
  item: MenuItem;
  busy?: boolean;
  onToggleAvailability: (available: boolean) => void;
  onAddStock: (qty: number) => void | Promise<void>;
  onSetStock: (qty: number) => void | Promise<void>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            <span className="mr-1.5" aria-hidden>
              {item.imageEmoji}
            </span>
            {item.name}
            {item.isDailySpecial && (
              <StatusChip label="Special" variant="special" className="ml-1" />
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Students see this count for online orders
          </p>
        </div>
        <label className="flex shrink-0 cursor-pointer flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-slate-500">
            {item.isAvailable ? "Online" : "Sold out"}
          </span>
          <span className="relative inline-flex h-6 w-11 items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={item.isAvailable}
              disabled={busy}
              onChange={(e) => onToggleAvailability(e.target.checked)}
              aria-label={`Toggle ${item.name} ${item.isAvailable ? "sold out" : "available for online orders"}`}
            />
            <span className="h-6 w-11 rounded-full bg-red-400 transition peer-checked:bg-green-600 peer-disabled:opacity-50 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
          </span>
        </label>
      </div>
      <InventoryStockControls
        currentStock={item.stockQuantity}
        itemName={item.name}
        busy={busy}
        onAddStock={onAddStock}
        onSetStock={onSetStock}
      />
    </div>
  );
}
