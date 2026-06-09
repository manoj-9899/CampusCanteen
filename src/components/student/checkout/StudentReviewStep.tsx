"use client";

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { OrderLineList, OrderTotalRow } from "./OrderLineList";
import type { CartItem } from "@/types";

export function StudentReviewStep({
  cart,
  total,
  busy,
  onEditCart,
  onConfirm,
}: {
  cart: CartItem[];
  total: number;
  busy: boolean;
  onEditCart: () => void;
  onConfirm: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <CardTitle>Order summary</CardTitle>
        <CardDescription>
          Review items and stock before confirming your order
        </CardDescription>

        <OrderLineList items={cart} className="mt-4" />
        <OrderTotalRow total={total} />

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={onEditCart} className="sm:flex-1">
            Edit cart
          </Button>
          <Button
            fullWidth
            loading={busy}
            onClick={onConfirm}
            className="sm:flex-[2]"
          >
            Confirm order
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
