"use client";

import { BarChart3, IndianRupee, ShoppingBag, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  StatusChip,
  orderStatusChipLabel,
  orderStatusChipVariant,
} from "@/components/ui/StatusChip";
import type { DailyAnalytics } from "@/types";

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              {value}
            </p>
          </div>
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function StaffSalesDashboard({
  analytics,
}: {
  analytics: DailyAnalytics;
}) {
  const hasActivity =
    analytics.ordersToday > 0 ||
    analytics.ordersByStatus.some((s) => s.count > 0);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-gradient-to-r from-primary-light/80 to-surface">
        <CardContent className="p-4 sm:p-5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" aria-hidden />
            Today&apos;s sales
          </CardTitle>
          <CardDescription>
            Live snapshot for {analytics.date} — paid orders and status breakdown
          </CardDescription>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          label="Orders today (paid)"
          value={String(analytics.ordersToday)}
          icon={ShoppingBag}
          accent="bg-primary-light text-primary"
        />
        <MetricCard
          label="Revenue today"
          value={`₹${analytics.revenueToday.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          accent="bg-green-100 text-green-700"
        />
      </div>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <CardTitle className="text-base">Orders by status</CardTitle>
          <CardDescription className="text-xs">
            All orders placed today, grouped by current status
          </CardDescription>
          {!hasActivity ? (
            <EmptyState
              className="mt-4 border-none bg-transparent py-6"
              icon={ShoppingBag}
              title="No orders yet today"
              description="Metrics will appear when students place orders."
            />
          ) : (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {analytics.ordersByStatus.map((row) => (
                <li
                  key={row.status}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-muted px-3 py-2.5"
                >
                  <StatusChip
                    label={orderStatusChipLabel(row.status)}
                    variant={orderStatusChipVariant(row.status)}
                  />
                  <span className="font-mono text-lg font-bold text-foreground">
                    {row.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-amber-500" aria-hidden />
            Top 5 selling items
          </CardTitle>
          <CardDescription className="text-xs">
            By quantity sold today (paid orders only)
          </CardDescription>
          {analytics.topItems.length === 0 ? (
            <EmptyState
              className="mt-4 border-none bg-transparent py-6"
              icon={Trophy}
              title="No sales yet"
              description="Best sellers will show up after today's first paid orders."
            />
          ) : (
            <ol className="mt-4 space-y-2">
              {analytics.topItems.map((item, index) => (
                <li
                  key={item.menuItemId}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted px-3 py-2.5"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light font-bold text-primary text-sm">
                    {index + 1}
                  </span>
                  <span className="text-xl" aria-hidden>
                    {item.imageEmoji}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                    {item.name}
                  </span>
                  <span className="shrink-0 font-mono text-sm font-bold text-primary">
                    {item.quantitySold} sold
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
