"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

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
  onOpenCart?: () => void;
  aboveBottomNav?: boolean;
}) {
  if (itemCount === 0) return null;

  const bottomClass = aboveBottomNav
    ? "bottom-[calc(3.5rem+env(safe-area-inset-bottom))]"
    : "bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]";

  return (
    <div
      className={cn("fixed left-0 right-0 z-40 px-3 lg:hidden", bottomClass)}
      role="region"
      aria-label="Cart summary"
    >
      <Button
        fullWidth
        size="lg"
        loading={busy}
        onClick={onOpenCart ?? onPrimary}
        className="mx-auto max-w-lg justify-between shadow-lg"
        aria-label={`${primaryLabel}, ${itemCount} items, ₹${total}`}
      >
        <span className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" aria-hidden />
          View cart
        </span>
        <span className="flex items-center gap-2">
          <span>₹{total}</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-primary">
            {itemCount}
          </span>
        </span>
      </Button>
    </div>
  );
}
