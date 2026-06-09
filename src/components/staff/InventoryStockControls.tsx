"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

function parseQty(value: string): number | null {
  const n = parseInt(value.trim(), 10);
  if (Number.isNaN(n) || n < 0 || n > 9999) return null;
  return n;
}

export function InventoryStockControls({
  currentStock,
  itemName,
  busy,
  onSetStock,
  onAddStock,
  layout = "card",
}: {
  currentStock: number;
  itemName: string;
  busy?: boolean;
  onSetStock: (qty: number) => void | Promise<void>;
  onAddStock?: (qty: number) => void | Promise<void>;
  layout?: "card" | "compact";
}) {
  const [qty, setQty] = useState(String(currentStock));
  const [showAddMore, setShowAddMore] = useState(false);
  const [addQty, setAddQty] = useState("");

  useEffect(() => {
    setQty(String(currentStock));
  }, [currentStock]);

  const submitUpdate = () => {
    const n = parseQty(qty);
    if (n === null) return;
    void onSetStock(n);
  };

  const submitAdd = () => {
    const n = parseQty(addQty);
    if (n === null || n === 0 || !onAddStock) return;
    void onAddStock(n);
    setAddQty("");
  };

  return (
    <div className={layout === "compact" ? "space-y-2" : "mt-3 space-y-2"}>
      <p
        className={cn(
          layout === "compact" ? "text-xs text-muted" : "text-xs font-medium text-muted"
        )}
      >
        {layout === "compact"
          ? "Stock:"
          : `How many ${itemName} are left for online orders?`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          max={9999}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitUpdate()}
          disabled={busy}
          className={cn(
            "text-center font-semibold",
            layout === "compact" ? "min-h-10 w-16 px-2 text-base" : "min-h-11 w-20 text-lg"
          )}
          aria-label={`Stock count for ${itemName}`}
        />
        <Button
          size={layout === "compact" ? "sm" : "md"}
          onClick={submitUpdate}
          loading={busy}
          className={layout === "compact" ? undefined : "flex-1"}
        >
          {layout === "compact" ? "Update" : "Update stock"}
        </Button>
      </div>

      {onAddStock && (
        <div>
          <button
            type="button"
            onClick={() => setShowAddMore((s) => !s)}
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            {showAddMore ? "Hide add-more options" : "Add more instead (new batch)"}
          </button>
          {showAddMore && (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-surface-muted p-2">
              <span className="text-xs text-muted">Add</span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={9999}
                placeholder="0"
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitAdd()}
                disabled={busy}
                className="w-16 px-2 py-1 text-center text-sm"
                aria-label="Quantity to add to current stock"
              />
              <Button size="sm" variant="secondary" onClick={submitAdd} disabled={busy}>
                Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => void onAddStock(10)}
              >
                +10
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => void onAddStock(25)}
              >
                +25
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
