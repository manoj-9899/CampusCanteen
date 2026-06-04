"use client";

import { Loader2 } from "lucide-react";
import {
  StatusChip,
  orderStatusChipLabel,
  orderStatusChipVariant,
} from "@/components/ui/StatusChip";
import { ActiveOrderBanner } from "../ActiveOrderBanner";
import type { Order } from "@/types";

export function StudentOrdersPanel({
  orders,
  activeOrder,
  receiptLoading,
  onOpenReceipt,
}: {
  orders: Order[];
  activeOrder?: Order;
  receiptLoading: boolean;
  onOpenReceipt: (orderId: string) => void;
}) {
  return (
    <div className="space-y-3 lg:hidden">
      {activeOrder && (
        <ActiveOrderBanner
          order={activeOrder}
          loading={receiptLoading}
          onViewReceipt={() => onOpenReceipt(activeOrder.id)}
        />
      )}

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">Your orders</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Tap an order to view receipt or QR code
        </p>
        <ul className="mt-3 space-y-2">
          {orders.map((order) => {
            const canOpenReceipt =
              order.paymentStatus === "PAID" &&
              order.status !== "CANCELLED" &&
              order.status !== "PENDING";
            return (
              <li key={order.id}>
                <button
                  type="button"
                  onClick={() => canOpenReceipt && onOpenReceipt(order.id)}
                  disabled={!canOpenReceipt || receiptLoading}
                  className={`w-full rounded-lg bg-slate-50 p-3 text-left text-sm transition ${
                    canOpenReceipt
                      ? "hover:bg-orange-50 active:bg-orange-100"
                      : "cursor-default opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-lg font-bold text-orange-600">
                      {order.tokenNumber}
                    </span>
                    <StatusChip
                      label={orderStatusChipLabel(order.status)}
                      variant={orderStatusChipVariant(order.status)}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{order.orderCode}</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    ₹{order.totalAmount}
                    {canOpenReceipt && (
                      <span className="ml-2 text-xs font-normal text-orange-600">
                        View receipt →
                      </span>
                    )}
                  </p>
                </button>
              </li>
            );
          })}
          {orders.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">
              No orders yet — browse the menu to place your first order.
            </p>
          )}
        </ul>
        {receiptLoading && (
          <p className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading receipt…
          </p>
        )}
      </div>
    </div>
  );
}
