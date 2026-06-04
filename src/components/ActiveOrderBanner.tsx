"use client";

import { Bell, ChevronRight, Loader2 } from "lucide-react";
import type { Order } from "@/types";

export function ActiveOrderBanner({
  order,
  loading,
  onViewReceipt,
}: {
  order: Order;
  loading?: boolean;
  onViewReceipt: () => void;
}) {
  const isReady = order.status === "READY_FOR_PICKUP";
  const statusLabel = isReady
    ? "Ready for pickup!"
    : order.status === "CONFIRMED"
      ? "Being prepared"
      : order.status.replace(/_/g, " ");

  return (
    <div
      className={`mb-4 flex items-center gap-3 rounded-xl border p-4 shadow-sm ${
        isReady
          ? "border-green-300 bg-green-50"
          : "border-orange-200 bg-orange-50"
      }`}
    >
      {isReady ? (
        <Bell className="h-6 w-6 shrink-0 text-green-600" />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-200 font-mono text-sm font-bold text-orange-800">
          {order.tokenNumber.slice(-2)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Active order
        </p>
        <p className="font-mono text-xl font-bold text-orange-600">
          {order.tokenNumber}
        </p>
        <p
          className={`text-sm font-medium ${isReady ? "text-green-800" : "text-orange-800"}`}
        >
          {statusLabel}
        </p>
      </div>
      <button
        type="button"
        onClick={onViewReceipt}
        disabled={loading}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-orange-700 shadow-sm ring-1 ring-orange-200 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            View QR
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
