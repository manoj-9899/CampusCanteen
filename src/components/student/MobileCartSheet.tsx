"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OrderTotalRow } from "./checkout/OrderLineList";
import { cn } from "@/lib/cn";
import type { CartItem, MenuItem } from "@/types";

export function MobileCartSheet({
  open,
  cart,
  menu,
  total,
  busy,
  onClose,
  onReview,
  onUpdateQty,
}: {
  open: boolean;
  cart: CartItem[];
  menu: MenuItem[];
  total: number;
  busy?: boolean;
  onClose: () => void;
  onReview: () => void;
  onUpdateQty: (menuItemId: string, delta: number) => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal
      aria-label="Your cart"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close cart"
      />
      <div className="absolute bottom-0 left-0 right-0 max-h-[min(85dvh,32rem)] rounded-t-2xl bg-surface shadow-2xl pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-bold text-foreground">
            Your cart ({cart.length})
          </h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            aria-label="Close"
            className="h-9 w-9 min-h-9 min-w-9"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ul className="max-h-[min(50dvh,20rem)] overflow-y-auto px-4 py-2">
          {cart.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted">Cart is empty</li>
          ) : (
            cart.map((item) => {
              const live = menu.find((m) => m.id === item.menuItemId);
              const unavailable = !live?.canOrder;
              return (
                <li
                  key={item.menuItemId}
                  className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
                >
                  <span className="text-2xl" aria-hidden>
                    {item.imageEmoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        unavailable
                          ? "text-muted line-through"
                          : "text-foreground"
                      )}
                    >
                      {item.name}
                    </p>
                    {unavailable ? (
                      <p className="text-xs font-medium text-danger">Sold out</p>
                    ) : (
                      <p className="text-sm font-semibold text-primary">
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
                        −
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        onClick={() => onUpdateQty(item.menuItemId, 1)}
                        disabled={item.quantity >= item.maxQuantity}
                        aria-label={`Increase ${item.name}`}
                        className="h-9 w-9 min-h-9 min-w-9"
                      >
                        +
                      </Button>
                    </div>
                  )}
                </li>
              );
            })
          )}
        </ul>

        <div className="border-t border-border px-4 py-3">
          <OrderTotalRow total={total} />
          <Button
            size="lg"
            fullWidth
            loading={busy}
            disabled={cart.length === 0}
            onClick={onReview}
            className="mt-3"
          >
            Review order
          </Button>
        </div>
      </div>
    </div>
  );
}
