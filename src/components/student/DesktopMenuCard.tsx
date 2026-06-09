"use client";

import { Button } from "@/components/ui/Button";
import { StatusChip, stockChipVariant } from "@/components/ui/StatusChip";
import { cn } from "@/lib/cn";
import type { MenuItem } from "@/types";

export function DesktopMenuCard({
  item,
  onAdd,
}: {
  item: MenuItem;
  onAdd: () => void;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm",
        !item.canOrder && "opacity-60",
        item.isDailySpecial && "ring-2 ring-amber-200"
      )}
    >
      <span className="text-4xl" aria-hidden>
        {item.imageEmoji}
      </span>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="font-semibold text-foreground">{item.name}</h3>
          {item.isDailySpecial && (
            <StatusChip label="Special" variant="special" />
          )}
          <StatusChip
            label={item.availabilityLabel}
            variant={stockChipVariant(item.stockStatus)}
          />
        </div>
        <p className="text-xs text-muted">{item.description}</p>
        <p className="mt-1 text-lg font-bold text-primary">₹{item.price}</p>
        {item.canOrder && (
          <p className="text-xs text-muted">{item.stockQuantity} in stock</p>
        )}
        <Button
          size="sm"
          onClick={onAdd}
          disabled={!item.canOrder}
          className="mt-2"
        >
          {item.canOrder ? "Add to cart" : "Unavailable"}
        </Button>
      </div>
    </div>
  );
}
