"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LowStockThresholdControl({
  value,
  itemName,
  busy,
  onSave,
  layout = "card",
}: {
  value: number;
  itemName: string;
  busy?: boolean;
  onSave: (threshold: number) => void | Promise<void>;
  layout?: "card" | "compact";
}) {
  const [threshold, setThreshold] = useState(String(value));

  useEffect(() => {
    setThreshold(String(value));
  }, [value]);

  const submit = () => {
    const n = parseInt(threshold.trim(), 10);
    if (Number.isNaN(n) || n < 0 || n > 9999) return;
    void onSave(n);
  };

  return (
    <div className={layout === "compact" ? "space-y-1" : "mt-2 space-y-1"}>
      <p className="text-xs text-muted">
        {layout === "compact"
          ? "Alert when ≤"
          : `Alert when ${itemName} stock falls to`}
      </p>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          max={9999}
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          disabled={busy}
          className={
            layout === "compact"
              ? "min-h-9 w-16 px-2 text-center text-sm"
              : "min-h-10 w-20 text-center"
          }
          aria-label={`Low stock alert threshold for ${itemName}`}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={submit}
          disabled={busy}
        >
          Set alert
        </Button>
      </div>
    </div>
  );
}
