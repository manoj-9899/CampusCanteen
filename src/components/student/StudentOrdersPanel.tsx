"use client";

import { Loader2, ShoppingBag } from "lucide-react";
import {
  StatusChip,
  orderStatusChipLabel,
  orderStatusChipVariant,
} from "@/components/ui/StatusChip";
import { ActiveOrderBanner } from "../ActiveOrderBanner";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
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

      <Card>
        <CardContent className="p-4">
          <CardTitle className="text-sm">Your orders</CardTitle>
          <CardDescription className="text-xs">
            Tap an order to view receipt or QR code
          </CardDescription>

          {orders.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon={ShoppingBag}
              title="No orders yet"
              description="Browse the menu and place your first pre-order."
            />
          ) : (
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
                      className={cn(
                        "w-full rounded-xl bg-surface-muted p-3 text-left text-sm transition",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        canOpenReceipt
                          ? "hover:bg-primary-light active:bg-orange-100"
                          : "cursor-default opacity-70"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-lg font-bold text-primary">
                          {order.tokenNumber}
                        </span>
                        <StatusChip
                          label={orderStatusChipLabel(order.status)}
                          variant={orderStatusChipVariant(order.status)}
                        />
                      </div>
                      <p className="mt-0.5 text-xs text-muted">{order.orderCode}</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        ₹{order.totalAmount}
                        {canOpenReceipt && (
                          <span className="ml-2 text-xs font-normal text-primary">
                            View receipt →
                          </span>
                        )}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {receiptLoading && (
            <p className="mt-2 flex items-center justify-center gap-2 text-xs text-muted">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              Loading receipt…
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
