"use client";

import type { Order } from "@/types";

export function StaffQueueSummary({ queue }: { queue: Order[] }) {
  const preparing = queue.filter((o) => o.status === "CONFIRMED").length;
  const ready = queue.filter((o) => o.status === "READY_FOR_PICKUP").length;

  if (queue.length === 0) {
    return (
      <p className="mb-3 rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
        No orders waiting for pickup
      </p>
    );
  }

  return (
    <div className="mb-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border bg-white px-3 py-2 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Preparing
          </p>
          <p className="text-2xl font-bold text-amber-700">{preparing}</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-wide text-green-800">
            Ready now
          </p>
          <p className="text-2xl font-bold text-green-800">{ready}</p>
        </div>
      </div>

      <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2 pb-1">
          {queue.map((o) => (
            <span
              key={o.id}
              className={`rounded-lg px-3 py-2 font-mono text-sm font-bold ${
                o.status === "READY_FOR_PICKUP"
                  ? "bg-green-100 text-green-900 ring-1 ring-green-200"
                  : "bg-orange-100 text-orange-900"
              }`}
            >
              {o.tokenNumber}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
