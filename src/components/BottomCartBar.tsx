"use client";

import { Loader2, ShoppingCart } from "lucide-react";

export function BottomCartBar({
  itemCount,
  total,
  primaryLabel,
  busy,
  onPrimary,
  onOpenCart,
  aboveBottomNav = true,
}: {
  itemCount: number;
  total: number;
  primaryLabel: string;
  busy?: boolean;
  onPrimary: () => void;
  /** On menu step: open cart sheet instead of jumping to review */
  onOpenCart?: () => void;
  /** When true, sits above the student bottom tab bar */
  aboveBottomNav?: boolean;
}) {
  if (itemCount === 0) return null;

  const bottomClass = aboveBottomNav
    ? "bottom-[calc(3.5rem+env(safe-area-inset-bottom))]"
    : "bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]";

  return (
    <div
      className={`fixed left-0 right-0 z-40 px-3 lg:hidden ${bottomClass}`}
    >
      <button
        type="button"
        onClick={onOpenCart ?? onPrimary}
        disabled={busy}
        className="mx-auto flex w-full max-w-lg items-center justify-between rounded-xl bg-orange-500 px-4 py-3.5 shadow-lg disabled:opacity-70"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ShoppingCart className="h-5 w-5" />
          )}
          View cart
        </span>
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">₹{total}</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-orange-700">
            {itemCount}
          </span>
        </span>
      </button>
    </div>
  );
}
