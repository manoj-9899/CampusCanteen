"use client";

import { Loader2, Minus, Plus, X } from "lucide-react";
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
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal aria-label="Your cart">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close cart"
      />
      <div className="absolute bottom-0 left-0 right-0 max-h-[min(85dvh,32rem)] rounded-t-2xl bg-white shadow-2xl pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-bold text-slate-900">
            Your cart ({cart.length})
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="touch-target-sm rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="max-h-[min(50dvh,20rem)] overflow-y-auto px-4 py-2">
          {cart.length === 0 ? (
            <li className="py-8 text-center text-sm text-slate-500">Cart is empty</li>
          ) : (
            cart.map((item) => {
              const live = menu.find((m) => m.id === item.menuItemId);
              const unavailable = !live?.canOrder;
              return (
                <li
                  key={item.menuItemId}
                  className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0"
                >
                  <span className="text-2xl" aria-hidden>
                    {item.imageEmoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium ${unavailable ? "text-slate-400 line-through" : "text-slate-900"}`}
                    >
                      {item.name}
                    </p>
                    {unavailable ? (
                      <p className="text-xs font-medium text-red-600">Sold out</p>
                    ) : (
                      <p className="text-sm font-semibold text-orange-600">
                        ₹{item.price * item.quantity}
                      </p>
                    )}
                  </div>
                  {!unavailable && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.menuItemId, -1)}
                        className="touch-target-sm flex items-center justify-center rounded-lg border p-2"
                        aria-label={`Decrease ${item.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.menuItemId, 1)}
                        disabled={item.quantity >= item.maxQuantity}
                        className="touch-target-sm flex items-center justify-center rounded-lg border p-2 disabled:opacity-40"
                        aria-label={`Increase ${item.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })
          )}
        </ul>

        <div className="border-t px-4 py-3">
          <div className="mb-3 flex justify-between text-base font-bold">
            <span>Total</span>
            <span className="text-orange-600">₹{total}</span>
          </div>
          <button
            type="button"
            onClick={onReview}
            disabled={busy || cart.length === 0}
            className="flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Review order
          </button>
        </div>
      </div>
    </div>
  );
}
