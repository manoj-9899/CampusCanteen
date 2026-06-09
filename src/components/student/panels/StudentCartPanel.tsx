"use client";

import { BottomCartBar } from "@/components/BottomCartBar";
import { MobileCartSheet } from "../MobileCartSheet";
import { DesktopCartSidebar } from "../checkout/DesktopCartSidebar";
import type { StudentStep } from "@/lib/student-menu-utils";
import type { CartItem, MenuItem, Order } from "@/types";

/** Desktop cart column (inside checkout grid). */
export function StudentDesktopCartColumn({
  cart,
  menu,
  cartTotal,
  step,
  orders,
  busy,
  receiptLoading,
  onUpdateQty,
  onValidateAndReview,
  onOpenReceipt,
}: {
  cart: CartItem[];
  menu: MenuItem[];
  cartTotal: number;
  step: StudentStep;
  orders: Order[];
  busy: boolean;
  receiptLoading: boolean;
  onUpdateQty: (id: string, delta: number) => void;
  onValidateAndReview: () => void;
  onOpenReceipt: (orderId: string) => void;
}) {
  return (
    <DesktopCartSidebar
      cart={cart}
      menu={menu}
      total={cartTotal}
      step={step}
      orders={orders}
      busy={busy}
      receiptLoading={receiptLoading}
      onUpdateQty={onUpdateQty}
      onReview={onValidateAndReview}
      onOpenReceipt={onOpenReceipt}
    />
  );
}

/** Mobile cart sheet + bottom bar (outside checkout grid). */
export function StudentMobileCartChrome({
  cart,
  menu,
  cartTotal,
  cartItemCount,
  step,
  busy,
  cartSheetOpen,
  showMobileCartBar,
  showMobileBottomNav,
  onUpdateQty,
  onValidateAndReview,
  onConfirmOrder,
  onOpenCartSheet,
  onCloseCartSheet,
}: {
  cart: CartItem[];
  menu: MenuItem[];
  cartTotal: number;
  cartItemCount: number;
  step: StudentStep;
  busy: boolean;
  cartSheetOpen: boolean;
  showMobileCartBar: boolean;
  showMobileBottomNav: boolean;
  onUpdateQty: (id: string, delta: number) => void;
  onValidateAndReview: () => void;
  onConfirmOrder: () => void;
  onOpenCartSheet: () => void;
  onCloseCartSheet: () => void;
}) {
  return (
    <>
      <MobileCartSheet
        open={cartSheetOpen}
        cart={cart}
        menu={menu}
        total={cartTotal}
        busy={busy}
        onClose={onCloseCartSheet}
        onReview={onValidateAndReview}
        onUpdateQty={onUpdateQty}
      />

      {showMobileCartBar && (
        <BottomCartBar
          itemCount={cartItemCount}
          total={cartTotal}
          busy={busy}
          aboveBottomNav={showMobileBottomNav}
          primaryLabel={step === "review" ? "Confirm order" : "Review order"}
          onOpenCart={step === "menu" ? onOpenCartSheet : undefined}
          onPrimary={
            step === "review" ? onConfirmOrder : onValidateAndReview
          }
        />
      )}
    </>
  );
}
