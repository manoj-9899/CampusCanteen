"use client";

import { AlertTriangle, Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { Forecast } from "@/types";

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-slate-400" />;
}

export function StaffForecastMobile({ forecast }: { forecast: Forecast }) {
  const focusItem =
    forecast.items.find((i) => i.predictedDemand > i.currentStock) ??
    forecast.items[0];

  return (
    <div className="space-y-3 lg:hidden">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border bg-white p-3 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Predicted orders
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {forecast.totalPredictedOrders}
          </p>
          <p className="text-[10px] text-slate-500">Next day</p>
        </div>
        <div className="rounded-xl border bg-white p-3 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Prep focus
          </p>
          <p className="mt-1 truncate text-lg font-bold text-orange-600">
            {focusItem?.menuItemName ?? "—"}
          </p>
        </div>
      </div>

      {focusItem && focusItem.predictedDemand > focusItem.currentStock && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-semibold text-amber-950">
              Prep focus: {focusItem.menuItemName}
            </p>
            <p className="text-xs text-amber-900">
              Predicted {focusItem.predictedDemand} · Stock {focusItem.currentStock}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-white p-3 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Demand vs stock
        </p>
        <ul className="divide-y divide-slate-100">
          {forecast.items.map((item) => {
            const short =
              item.predictedDemand > item.currentStock;
            return (
              <li
                key={item.menuItemId}
                className="flex items-center gap-2 py-2.5 text-sm"
              >
                <span className="min-w-0 flex-1 font-medium text-slate-900">
                  {item.menuItemName}
                </span>
                <span className="shrink-0 text-xs text-slate-500">
                  {item.predictedDemand}/{item.currentStock}
                </span>
                <span
                  className={`shrink-0 text-xs font-semibold ${
                    short ? "text-orange-700" : "text-slate-600"
                  }`}
                >
                  batch {item.suggestedPrep}
                </span>
                <TrendIcon trend={item.trend} />
              </li>
            );
          })}
        </ul>
      </div>

      <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-900">
        Forecasts use limited historical data. Accuracy improves after more weeks of
        orders.
      </p>
    </div>
  );
}
