"use client";

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Order } from "@/types";

const PAYMENT_METHODS = [
  { id: "UPI", label: "UPI" },
  { id: "GOOGLE_PAY", label: "Google Pay" },
  { id: "PHONEPE", label: "PhonePe" },
  { id: "PAYTM", label: "Paytm" },
  { id: "CARD", label: "Debit/Credit Card" },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export function StudentPaymentStep({
  order,
  paymentMethod,
  busy,
  onSelectMethod,
  onPay,
  onCancel,
}: {
  order: Order;
  paymentMethod: PaymentMethodId;
  busy: boolean;
  onSelectMethod: (id: PaymentMethodId) => void;
  onPay: () => void;
  onCancel: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <CardTitle>Online payment</CardTitle>
        <CardDescription>
          {order.orderCode} · ₹{order.totalAmount}
        </CardDescription>
        <p className="mt-2 text-xs text-muted">
          Availability is checked again when you pay
        </p>

        <fieldset className="mt-4">
          <legend className="sr-only">Payment method</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PAYMENT_METHODS.map((m) => {
              const selected = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectMethod(m.id)}
                  className={cn(
                    "min-h-11 rounded-xl border py-2 text-sm font-medium transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    selected
                      ? "border-primary bg-primary-light text-primary"
                      : "border-border bg-surface text-foreground hover:bg-surface-muted"
                  )}
                  aria-pressed={selected}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <Button
          variant="success"
          size="lg"
          fullWidth
          loading={busy}
          onClick={onPay}
          className="mt-6"
        >
          {busy ? "Verifying stock & processing…" : `Pay ₹${order.totalAmount}`}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          disabled={busy}
          onClick={onCancel}
          className="mt-2 text-muted"
        >
          Cancel order
        </Button>
      </CardContent>
    </Card>
  );
}
