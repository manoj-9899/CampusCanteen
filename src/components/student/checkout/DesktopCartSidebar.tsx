"use client";

import { Minus, Plus, ShoppingBag, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderTotalRow } from "./OrderLineList";
import { StatusChip, orderStatusChipLabel, orderStatusChipVariant } from "@/components/ui/StatusChip";
import { cn } from "@/lib/cn";
import type { CartItem, MenuItem, Order } from "@/types";

export function DesktopCartSidebar({
  cart,
  menu,
  total,
  step,
  orders,
  busy,
  receiptLoading,
  onUpdateQty,
  onReview,
  onOpenReceipt,
}: {
  cart: CartItem[];
  menu: MenuItem[];
  total: number;
  step: "menu" | "review" | "payment" | "receipt";
  orders: Order[];
  busy: boolean;
  receiptLoading: boolean;
  onUpdateQty: (menuItemId: string, delta: number) => void;
  onReview: () => void;
  onOpenReceipt: (orderId: string) => void;
}) {
  return (
    <div className="hidden space-y-4 lg:block">
      <Card className="sticky top-20">
        <CardContent className="p-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-5 w-5 text-primary" aria-hidden />
            Cart ({cart.length})
          </CardTitle>

          {cart.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Cart is empty</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {cart.map((item) => {
                const live = menu.find((m) => m.id === item.menuItemId);
                const unavailable = !live?.canOrder;
                return (
                  <li key={item.menuItemId} className="flex items-center gap-2">
                    <span aria-hidden>{item.imageEmoji}</span>
                    <div className="flex-1 text-sm">
                      <p
                        className={cn(
                          "font-medium",
                          unavailable && "text-muted line-through"
                        )}
                      >
                        {item.name}
                      </p>
                      {unavailable ? (
                        <p className="text-xs font-medium text-danger">
                          Sold out — removing from cart…
                        </p>
                      ) : (
                        <p className="text-primary">
                          ₹{item.price * item.quantity}
                        </p>
                      )}
                    </div>
                    {!unavailable && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => onUpdateQty(item.menuItemId, -1)}
                          aria-label={`Decrease ${item.name}`}
                          className="h-9 w-9 min-h-9 min-w-9"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-5 text-center text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => onUpdateQty(item.menuItemId, 1)}
                          disabled={item.quantity >= item.maxQuantity}
                          aria-label={`Increase ${item.name}`}
                          className="h-9 w-9 min-h-9 min-w-9"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4">
            <OrderTotalRow total={total} />
            {step === "menu" && cart.length > 0 && (
              <Button
                fullWidth
                loading={busy}
                onClick={onReview}
                className="mt-3"
              >
                Review order
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <CardTitle className="text-base">Order history</CardTitle>
          {orders.length === 0 ? (
            <EmptyState
              className="mt-3 border-none bg-transparent p-4"
              icon={ShoppingBag}
              title="No orders yet"
              description="Your past orders will appear here."
            />
          ) : (
            <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {orders.map((order) => {
                const canOpenReceipt =
                  order.paymentStatus === "PAID" &&
                  order.status !== "CANCELLED" &&
                  order.status !== "PENDING";
                return (
                  <li key={order.id}>
                    <button
                      type="button"
                      onClick={() =>
                        canOpenReceipt && onOpenReceipt(order.id)
                      }
                      disabled={!canOpenReceipt || receiptLoading}
                      className={cn(
                        "w-full rounded-xl bg-surface-muted p-3 text-left text-sm transition",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        canOpenReceipt
                          ? "hover:bg-primary-light hover:ring-1 hover:ring-primary/30"
                          : "cursor-default opacity-70"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-primary">
                          {order.tokenNumber}
                        </span>
                        <StatusChip
                          label={orderStatusChipLabel(order.status)}
                          variant={orderStatusChipVariant(order.status)}
                        />
                      </div>
                      <p className="text-xs text-muted">{order.orderCode}</p>
                      <p className="text-xs text-foreground">
                        ₹{order.totalAmount}
                        {canOpenReceipt && (
                          <span className="ml-2 text-primary">
                            · Tap for receipt
                          </span>
                        )}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
