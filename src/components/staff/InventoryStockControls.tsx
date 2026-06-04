"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

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

  const inputClass =
    layout === "compact"
      ? "min-h-10 w-16 rounded-lg border px-2 text-center text-base font-semibold"
      : "min-h-11 w-20 rounded-lg border px-3 text-center text-lg font-semibold";

  const updateBtn =
    layout === "compact"
      ? "min-h-10 rounded-lg bg-orange-500 px-3 text-xs font-semibold text-white disabled:opacity-50"
      : "min-h-11 flex-1 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white disabled:opacity-50";

  return (
    <div className={layout === "compact" ? "space-y-2" : "mt-3 space-y-2"}>
      <p className={layout === "compact" ? "text-xs text-slate-500" : "text-xs font-medium text-slate-600"}>
        {layout === "compact" ? "Stock:" : `How many ${itemName} are left for online orders?`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={9999}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitUpdate()}
          disabled={busy}
          className={inputClass}
          aria-label={`Stock count for ${itemName}`}
        />
        <button type="button" onClick={submitUpdate} disabled={busy} className={updateBtn}>
          {busy ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          ) : layout === "compact" ? (
            "Update"
          ) : (
            "Update stock"
          )}
        </button>
      </div>

      {onAddStock && (
        <div>
          <button
            type="button"
            onClick={() => setShowAddMore((s) => !s)}
            className="text-xs font-medium text-orange-700 underline-offset-2 hover:underline"
          >
            {showAddMore ? "Hide add-more options" : "Add more instead (new batch)"}
          </button>
          {showAddMore && (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-2">
              <span className="text-xs text-slate-600">Add</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={9999}
                placeholder="0"
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitAdd()}
                disabled={busy}
                className="w-16 rounded border px-2 py-1 text-center text-sm"
                aria-label="Quantity to add to current stock"
              />
              <button
                type="button"
                onClick={submitAdd}
                disabled={busy}
                className="rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onAddStock(10)}
                className="rounded border px-2 py-1 text-xs hover:bg-white disabled:opacity-50"
              >
                +10
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onAddStock(25)}
                className="rounded border px-2 py-1 text-xs hover:bg-white disabled:opacity-50"
              >
                +25
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
