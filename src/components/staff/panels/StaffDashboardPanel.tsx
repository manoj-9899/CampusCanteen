"use client";

import { BarChart3 } from "lucide-react";
import { StaffSalesDashboard } from "../StaffSalesDashboard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { DailyAnalytics } from "@/types";

export function StaffDashboardPanel({
  analytics,
}: {
  analytics: DailyAnalytics | null;
}) {
  return (
    <div id="staff-panel-sales" role="tabpanel" aria-labelledby="staff-tab-sales">
      {analytics ? (
        <StaffSalesDashboard analytics={analytics} />
      ) : (
        <EmptyState
          icon={BarChart3}
          title="Loading today's sales"
          description="Pull to refresh or tap Refresh if this takes more than a moment."
        />
      )}
    </div>
  );
}
