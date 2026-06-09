"use client";

import { Bell, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Order } from "@/types";

export function ActiveOrderBanner({
  order,
  loading,
  onViewReceipt,
  onCancel,
  cancelBusy,
}: {
  order: Order;
  loading?: boolean;
  onViewReceipt: () => void;
  onCancel?: () => void;
  cancelBusy?: boolean;
}) {
  const isReady = order.status === "READY_FOR_PICKUP";
  const canCancel =
    order.status === "CONFIRMED" && order.paymentStatus === "PAID";
  const statusLabel = isReady
    ? "Ready for pickup!"
    : order.status === "CONFIRMED"
      ? "Being prepared"
      : order.status.replace(/_/g, " ");

  return (
    <div
      className={cn(
        "mb-4 flex items-center gap-3 rounded-2xl border p-4 shadow-sm",
        isReady
          ? "border-green-300 bg-green-50"
          : "border-primary/30 bg-primary-light"
      )}
      role="status"
    >
      {isReady ? (
        <Bell className="h-6 w-6 shrink-0 text-success" aria-hidden />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-200 font-mono text-sm font-bold text-primary">
          {order.tokenNumber.slice(-2)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Active order
        </p>
        <p className="font-mono text-xl font-bold text-primary">
          {order.tokenNumber}
        </p>
        <p
          className={cn(
            "text-sm font-medium",
            isReady ? "text-green-800" : "text-primary"
          )}
        >
          {statusLabel}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onViewReceipt}
          loading={loading}
          className="bg-surface shadow-sm"
        >
          View QR
          <ChevronRight className="h-4 w-4" />
        </Button>
        {canCancel && onCancel && (
          <Button
            variant="ghost"
            size="sm"
            loading={cancelBusy}
            onClick={onCancel}
            className="text-xs text-muted"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
