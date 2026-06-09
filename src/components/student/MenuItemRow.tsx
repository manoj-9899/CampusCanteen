"use client";

import { Minus, Plus } from "lucide-react";
import { StatusChip, stockChipVariant } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { MenuItem } from "@/types";

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
    <span className="text-xs font-medium text-muted">Sold out</span>
  ) : quantity === 0 ? (
    <Button
      size="icon"
      onClick={onAdd}
      aria-label={`Add ${item.name}`}
      className="text-lg font-medium"
    >
      +
    </Button>
  ) : (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        size="icon"
        variant="outline"
        onClick={onDecrement}
        aria-label={`Decrease ${item.name}`}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span
        className="min-w-[1.25rem] text-center text-sm font-semibold"
        aria-live="polite"
      >
        {quantity}
      </span>
      <Button
        size="icon"
        onClick={onIncrement}
        disabled={quantity >= item.stockQuantity}
        aria-label={`Increase ${item.name}`}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div
      className={cn(
        "border-b border-border py-3 last:border-b-0 last:pb-0",
        !canOrder && "opacity-70"
      )}
    >
      <div className="flex min-w-0 gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-xl sm:h-11 sm:w-11"
          aria-hidden
        >
          {item.imageEmoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-semibold text-foreground">{item.name}</p>
            {item.isDailySpecial && (
              <StatusChip label="Special" variant="special" />
            )}
            <StatusChip
              label={item.availabilityLabel}
              variant={stockChipVariant(item.stockStatus)}
            />
          </div>
          <p className="line-clamp-2 text-xs text-muted">{item.description}</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 pl-[3.25rem] sm:pl-14">
        <span className="text-sm font-bold text-primary">₹{item.price}</span>
        {actions}
      </div>
    </div>
  );
}
