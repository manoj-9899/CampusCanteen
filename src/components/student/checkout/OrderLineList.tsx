import type { CartItem } from "@/types";
import { cn } from "@/lib/cn";

export function OrderLineList({
  items,
  className,
}: {
  items: CartItem[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item) => (
        <li
          key={item.menuItemId}
          className="flex items-start justify-between gap-3 text-sm"
        >
          <span className="min-w-0 text-foreground">
            <span aria-hidden>{item.imageEmoji}</span> {item.name}{" "}
            <span className="text-muted">× {item.quantity}</span>
          </span>
          <span className="shrink-0 font-medium text-foreground">
            ₹{item.price * item.quantity}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotalRow({ total }: { total: number }) {
  return (
    <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
      <span>Total</span>
      <span className="text-primary">₹{total}</span>
    </div>
  );
}
