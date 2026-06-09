"use client";

import { AlertTriangle } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { StatusChip } from "@/components/ui/StatusChip";
import type { LowStockAlertItem } from "@/lib/low-stock";

export function StaffLowStockBanner({
  alerts,
  onGoToInventory,
}: {
  alerts: LowStockAlertItem[];
  onGoToInventory?: () => void;
}) {
  if (alerts.length === 0) return null;

  const outCount = alerts.filter((a) => a.severity === "out").length;
  const lowCount = alerts.filter((a) => a.severity === "low").length;

  return (
    <Alert variant="warning" className="mb-4">
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            Low stock alert — {alerts.length} item
            {alerts.length === 1 ? "" : "s"} need attention
          </p>
          <p className="mt-1 text-sm">
            {outCount > 0 && (
              <span>
                {outCount} out / sold out
                {lowCount > 0 ? " · " : ""}
              </span>
            )}
            {lowCount > 0 && <span>{lowCount} below threshold</span>}
            {onGoToInventory && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={onGoToInventory}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Review inventory →
                </button>
              </>
            )}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {alerts.slice(0, 6).map((item) => (
              <li key={item.id}>
                <StatusChip
                  label={`${item.imageEmoji} ${item.name}: ${item.stockQuantity}`}
                  variant={item.severity === "out" ? "out" : "low"}
                />
              </li>
            ))}
            {alerts.length > 6 && (
              <li>
                <StatusChip
                  label={`+${alerts.length - 6} more`}
                  variant="neutral"
                />
              </li>
            )}
          </ul>
        </div>
      </div>
    </Alert>
  );
}
