"use client";

import { AlertTriangle, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/cn";
import type { Forecast } from "@/types";

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-success" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-danger" />;
  return <Minus className="h-4 w-4 text-muted" />;
}

export function StaffForecastMobile({ forecast }: { forecast: Forecast }) {
  const focusItem =
    forecast.items.find((i) => i.predictedDemand > i.currentStock) ??
    forecast.items[0];

  return (
    <div className="space-y-3 lg:hidden">
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
              Predicted orders
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {forecast.totalPredictedOrders}
            </p>
            <p className="text-[10px] text-muted">Next day</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
              Prep focus
            </p>
            <p className="mt-1 truncate text-lg font-bold text-primary">
              {focusItem?.menuItemName ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {focusItem && focusItem.predictedDemand > focusItem.currentStock && (
        <Alert variant="warning" className="flex items-start gap-2 p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-semibold">
              Prep focus: {focusItem.menuItemName}
            </p>
            <p className="text-xs">
              Predicted {focusItem.predictedDemand} · Stock{" "}
              {focusItem.currentStock}
            </p>
          </div>
        </Alert>
      )}

      <Card>
        <CardContent className="p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Demand vs stock
          </p>
          <ul className="divide-y divide-border">
            {forecast.items.map((item) => {
              const short = item.predictedDemand > item.currentStock;
              return (
                <li
                  key={item.menuItemId}
                  className="flex items-center gap-2 py-2.5 text-sm"
                >
                  <span className="min-w-0 flex-1 font-medium text-foreground">
                    {item.menuItemName}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {item.predictedDemand}/{item.currentStock}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-semibold",
                      short ? "text-primary" : "text-muted"
                    )}
                  >
                    batch {item.suggestedPrep}
                  </span>
                  <TrendIcon trend={item.trend} />
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Alert variant="info" className="text-xs leading-relaxed">
        Forecasts use limited historical data. Accuracy improves after more weeks
        of orders.
      </Alert>
    </div>
  );
}
