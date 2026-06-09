"use client";

import { OrderReceipt } from "@/components/OrderReceipt";
import { StudentReviewStep } from "../checkout/StudentReviewStep";
import {
  StudentPaymentStep,
  type PaymentMethodId,
} from "../checkout/StudentPaymentStep";
import type { CartItem, Order } from "@/types";

export function StudentReceiptPanel({
  order,
  cancelBusy,
  onCancel,
  onDone,
}: {
  order: Order;
  cancelBusy: boolean;
  onCancel: () => void;
  onDone: () => void;
}) {
  return (
    <OrderReceipt
      order={order}
      cancelBusy={cancelBusy}
      onCancel={onCancel}
      onDone={onDone}
    />
  );
}

export function StudentCheckoutPanel({
  step,
  cart,
  cartTotal,
  pendingOrder,
  paymentMethod,
  busy,
  cancelBusy,
  onEditCart,
  onConfirmOrder,
  onSelectPaymentMethod,
  onPay,
  onCancelPayment,
}: {
  step: "review" | "payment";
  cart: CartItem[];
  cartTotal: number;
  pendingOrder: Order | null;
  paymentMethod: PaymentMethodId;
  busy: boolean;
  cancelBusy: boolean;
  onEditCart: () => void;
  onConfirmOrder: () => void;
  onSelectPaymentMethod: (method: PaymentMethodId) => void;
  onPay: () => void;
  onCancelPayment: () => void;
}) {
  if (step === "review") {
    return (
      <StudentReviewStep
        cart={cart}
        total={cartTotal}
        busy={busy}
        onEditCart={onEditCart}
        onConfirm={onConfirmOrder}
      />
    );
  }

  if (pendingOrder) {
    return (
      <StudentPaymentStep
        order={pendingOrder}
        paymentMethod={paymentMethod}
        busy={busy || cancelBusy}
        onSelectMethod={onSelectPaymentMethod}
        onPay={onPay}
        onCancel={onCancelPayment}
      />
    );
  }

  return null;
}
