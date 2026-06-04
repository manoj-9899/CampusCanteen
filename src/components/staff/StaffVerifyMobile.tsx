"use client";

import { Clock } from "lucide-react";

export function StaffVerifyMobile({ pendingCount }: { pendingCount: number }) {
  if (pendingCount === 0) return null;

  return (
    <div className="mb-3 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 lg:hidden">
      <span className="flex items-center gap-1.5 text-sm text-green-900">
        <Clock className="h-4 w-4" />
        Pending pickups
      </span>
      <strong className="text-sm font-bold text-green-900">
        {pendingCount} {pendingCount === 1 ? "order" : "orders"}
      </strong>
    </div>
  );
}
