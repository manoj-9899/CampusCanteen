"use client";

import { Loader2 } from "lucide-react";
import {
  StatusChip,
  orderStatusChipLabel,
  orderStatusChipVariant,
} from "@/components/ui/StatusChip";
import type { Order } from "@/types";

export function StaffQueueOrderCard({
  order,
  busy,
  onMarkReady,
}: {
  order: Order;
  busy?: boolean;
  onMarkReady: () => void;
}) {
  const isReady = order.status === "READY_FOR_PICKUP";

  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-2xl font-black text-orange-600 sm:text-3xl">
            {order.tokenNumber}
          </p>
          <p className="text-xs text-slate-500 sm:text-sm">{order.orderCode}</p>
          <p className="mt-1 text-sm text-slate-800">
            {order.user?.name}
            {order.user?.studentId && (
              <span className="text-slate-500"> · {order.user.studentId}</span>
            )}
          </p>
        </div>
        <StatusChip
          label={orderStatusChipLabel(order.status)}
          variant={orderStatusChipVariant(order.status)}
        />
      </div>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-800 sm:text-sm"
          >
            {item.menuItem.imageEmoji} {item.menuItem.name} ×{item.quantity}
          </li>
        ))}
      </ul>

      {order.status === "CONFIRMED" && (
        <button
          type="button"
          onClick={onMarkReady}
          disabled={busy}
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Mark packed & ready for pickup
        </button>
      )}

      {isReady && (
        <p className="mt-3 text-center text-xs font-medium text-green-700">
          Waiting at counter — verify token when student arrives
        </p>
      )}
    </article>
  );
}
