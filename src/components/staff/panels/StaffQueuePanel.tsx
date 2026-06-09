"use client";

import { ClipboardList } from "lucide-react";
import { StaffQueueOrderCard } from "../StaffQueueOrderCard";
import { StaffQueueSummary } from "../StaffQueueSummary";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Order } from "@/types";

export function StaffQueuePanel({
  queue,
  busy,
  onMarkReady,
}: {
  queue: Order[];
  busy: boolean;
  onMarkReady: (orderId: string) => void;
}) {
  return (
    <div id="staff-panel-queue" role="tabpanel" aria-labelledby="staff-tab-queue">
      <StaffQueueSummary queue={queue} />
      <div className="space-y-3">
        {queue.map((order) => (
          <StaffQueueOrderCard
            key={order.id}
            order={order}
            busy={busy}
            onMarkReady={() => onMarkReady(order.id)}
          />
        ))}
        {queue.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title="Queue is clear"
            description="New paid orders will appear here automatically. Students are notified when you mark orders ready."
          />
        )}
      </div>
    </div>
  );
}
