"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { Order } from "@/types";

export function StaffQueueSummary({ queue }: { queue: Order[] }) {
  const preparing = queue.filter((o) => o.status === "CONFIRMED").length;
  const ready = queue.filter((o) => o.status === "READY_FOR_PICKUP").length;

  if (queue.length === 0) return null;

  return (
    <div className="mb-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
              Preparing
            </p>
            <p className="text-2xl font-bold text-amber-700">{preparing}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-green-800">
              Ready now
            </p>
            <p className="text-2xl font-bold text-green-800">{ready}</p>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2 pb-1">
          {queue.map((o) => (
            <span
              key={o.id}
              className={cn(
                "rounded-xl px-3 py-2 font-mono text-sm font-bold",
                o.status === "READY_FOR_PICKUP"
                  ? "bg-green-100 text-green-900 ring-1 ring-green-200"
                  : "bg-primary-light text-primary"
              )}
            >
              {o.tokenNumber}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
