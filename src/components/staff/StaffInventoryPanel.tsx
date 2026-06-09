"use client";

import { Package } from "lucide-react";
import { StaffLowStockBanner } from "./StaffLowStockBanner";
import { InventoryItemCard } from "./InventoryItemCard";
import { LowStockThresholdControl } from "./LowStockThresholdControl";
import { getLowStockAlerts } from "@/lib/low-stock";
import { InventoryStockControls } from "./InventoryStockControls";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/Card";
import { StatusChip, stockChipVariant } from "@/components/ui/StatusChip";
import { cn } from "@/lib/cn";
import type { MenuItem } from "@/types";

export function StaffInventoryPanel({
  inventory,
  busy,
  onToggleAvailability,
  onAddStock,
  onSetStock,
  onSetLowStockThreshold,
}: {
  inventory: MenuItem[];
  busy: boolean;
  onToggleAvailability: (menuItemId: string, available: boolean) => void;
  onAddStock: (menuItemId: string, qty: number) => void;
  onSetStock: (menuItemId: string, qty: number) => void;
  onSetLowStockThreshold: (menuItemId: string, threshold: number) => void;
}) {
  const lowStockAlerts = getLowStockAlerts(inventory);

  return (
    <div className="space-y-4">
      <StaffLowStockBanner alerts={lowStockAlerts} />

    <Card>
      <CardContent className="p-4 sm:p-5">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" aria-hidden />
          Menu availability
        </CardTitle>
        <CardDescription>
          Count what is left, tap <strong>Update stock</strong>, and mark items{" "}
          <strong>sold out</strong> when students should not order online.
        </CardDescription>

        <div className="mt-4 space-y-3 lg:hidden">
          {inventory.map((item) => (
            <InventoryItemCard
              key={item.id}
              item={item}
              busy={busy}
              onToggleAvailability={(available) =>
                onToggleAvailability(item.id, available)
              }
              onAddStock={(qty) => onAddStock(item.id, qty)}
              onSetStock={(qty) => onSetStock(item.id, qty)}
              onSetLowStockThreshold={(t) => onSetLowStockThreshold(item.id, t)}
            />
          ))}
        </div>

        <table className="mt-4 hidden w-full text-sm lg:table">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="pb-2">Item</th>
              <th className="pb-2">App stock</th>
              <th className="pb-2">Alert at ≤</th>
              <th className="pb-2">Online orders</th>
              <th className="pb-2">Update stock</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.id} className="border-b border-border">
                <td className="py-3">
                  <span aria-hidden>{item.imageEmoji}</span> {item.name}
                  {item.isDailySpecial && (
                    <StatusChip
                      label="Special"
                      variant="special"
                      className="ml-1"
                    />
                  )}
                  <div className="mt-0.5">
                    <StatusChip
                      label={item.availabilityLabel}
                      variant={stockChipVariant(item.stockStatus)}
                    />
                  </div>
                </td>
                <td className="font-bold">{item.stockQuantity}</td>
                <td className="py-3">
                  <LowStockThresholdControl
                    layout="compact"
                    value={item.lowStockThreshold}
                    itemName={item.name}
                    busy={busy}
                    onSave={(t) => onSetLowStockThreshold(item.id, t)}
                  />
                </td>
                <td>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant={item.isAvailable ? "success" : "outline"}
                      onClick={() => onToggleAvailability(item.id, true)}
                      disabled={busy || item.isAvailable}
                      className={cn(
                        !item.isAvailable &&
                          "bg-transparent text-foreground"
                      )}
                    >
                      Available
                    </Button>
                    <Button
                      size="sm"
                      variant={!item.isAvailable ? "danger" : "outline"}
                      onClick={() => onToggleAvailability(item.id, false)}
                      disabled={busy || !item.isAvailable}
                      className={cn(
                        item.isAvailable &&
                          "bg-transparent text-foreground"
                      )}
                    >
                      Sold out
                    </Button>
                  </div>
                </td>
                <td className="min-w-[12rem] py-3">
                  <InventoryStockControls
                    layout="compact"
                    currentStock={item.stockQuantity}
                    itemName={item.name}
                    busy={busy}
                    onAddStock={(qty) => onAddStock(item.id, qty)}
                    onSetStock={(qty) => onSetStock(item.id, qty)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
    </div>
  );
}
