"use client";

import {
  StatusChip,
  orderStatusChipLabel,
  orderStatusChipVariant,
} from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
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
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-2xl font-black text-primary sm:text-3xl">
              {order.tokenNumber}
            </p>
            <p className="text-xs text-muted sm:text-sm">{order.orderCode}</p>
            <p className="mt-1 text-sm text-foreground">
              {order.user?.name}
              {order.user?.studentId && (
                <span className="text-muted"> · {order.user.studentId}</span>
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
              className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-foreground sm:text-sm"
            >
              {item.menuItem.imageEmoji} {item.menuItem.name} ×{item.quantity}
            </li>
          ))}
        </ul>

        {order.status === "CONFIRMED" && (
          <Button
            fullWidth
            loading={busy}
            onClick={onMarkReady}
            className="mt-4"
          >
            Mark packed &amp; ready for pickup
          </Button>
        )}

        {isReady && (
          <p className="mt-3 text-center text-xs font-medium text-success">
            Waiting at counter — verify token when student arrives
          </p>
        )}
      </CardContent>
    </Card>
  );
}
