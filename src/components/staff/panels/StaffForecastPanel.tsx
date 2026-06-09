"use client";

import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StaffForecastMobile } from "../StaffForecastMobile";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Forecast } from "@/types";

export function StaffForecastPanel({
  forecast,
  chartReady,
}: {
  forecast: Forecast | null;
  chartReady: boolean;
}) {
  if (!forecast) {
    return (
      <div
        id="staff-panel-forecast"
        role="tabpanel"
        aria-labelledby="staff-tab-forecast"
      >
        <EmptyState
          icon={BarChart3}
          title="Not enough order history"
          description="Forecast appears after your canteen has more completed orders. Keep using the queue and inventory — predictions will show up soon."
        />
      </div>
    );
  }

  const chartData = forecast.items.slice(0, 6).map((i) => ({
    name: i.menuItemName,
    predicted: i.predictedDemand,
    stock: i.currentStock,
  }));

  return (
    <div className="space-y-6" id="staff-panel-forecast" role="tabpanel" aria-labelledby="staff-tab-forecast">
      <StaffForecastMobile forecast={forecast} />

      <div className="hidden gap-4 sm:grid-cols-2 lg:grid">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted">Predicted orders (next day)</p>
            <p className="text-3xl font-bold text-foreground">
              {forecast.totalPredictedOrders}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted">Suggested prep focus</p>
            <p className="text-3xl font-bold text-primary">
              {forecast.items[0]?.menuItemName ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="hidden lg:block">
        <CardContent className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-bold">
            <BarChart3 className="h-5 w-5" />
            Predicted demand vs current stock
          </h3>
          <div className="h-64 w-full min-w-0">
            {chartReady && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={256} minWidth={0}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="predicted" fill="#f97316" name="Predicted" />
                  <Bar dataKey="stock" fill="#94a3b8" name="In stock" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                Loading chart…
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="hidden lg:block">
        <CardContent className="p-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th>Item</th>
                <th>Predicted</th>
                <th>Stock</th>
                <th>Suggested batch</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {forecast.items.map((item) => (
                <tr key={item.menuItemId} className="border-b border-border">
                  <td className="py-2 font-medium">{item.menuItemName}</td>
                  <td>{item.predictedDemand}</td>
                  <td>{item.currentStock}</td>
                  <td className="text-primary">{item.suggestedPrep}</td>
                  <td>
                    {item.trend === "up" && (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    )}
                    {item.trend === "down" && (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    {item.trend === "stable" && (
                      <Minus className="h-4 w-4 text-slate-400" />
                    )}
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
