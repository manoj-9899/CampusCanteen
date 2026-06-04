"use client";

import { Minus, Plus } from "lucide-react";
import { StatusChip, stockChipVariant } from "@/components/ui/StatusChip";
import type { MenuItem } from "@/types";

const ADD_BTN =
  "touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-lg font-medium text-white disabled:bg-slate-300 disabled:opacity-70 sm:h-11 sm:w-11";
const QTY_BTN =
  "touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white sm:h-11 sm:w-11";

export function MenuItemRow({
  item,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
}: {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const canOrder = item.canOrder;

  const actions = !canOrder ? (
    <span className="text-xs font-medium text-slate-400">Sold out</span>
  ) : quantity === 0 ? (
    <button
      type="button"
      onClick={onAdd}
      className={ADD_BTN}
      aria-label={`Add ${item.name}`}
    >
      +
    </button>
  ) : (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onDecrement}
        className={QTY_BTN}
        aria-label={`Decrease ${item.name}`}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-[1.25rem] text-center text-sm font-semibold">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={quantity >= item.stockQuantity}
        className={`${ADD_BTN} disabled:opacity-40`}
        aria-label={`Increase ${item.name}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div
      className={`border-b border-slate-100 py-3 last:border-b-0 last:pb-0 ${
        !canOrder ? "opacity-70" : ""
      }`}
    >
      <div className="flex min-w-0 gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-xl sm:h-11 sm:w-11"
          aria-hidden
        >
          {item.imageEmoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-semibold text-slate-900">{item.name}</p>
            {item.isDailySpecial && <StatusChip label="Special" variant="special" />}
            <StatusChip
              label={item.availabilityLabel}
              variant={stockChipVariant(item.stockStatus)}
            />
          </div>
          <p className="line-clamp-2 text-xs text-slate-500">{item.description}</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 pl-[3.25rem] sm:pl-14">
        <span className="text-sm font-bold text-orange-600">₹{item.price}</span>
        {actions}
      </div>
    </div>
  );
}
