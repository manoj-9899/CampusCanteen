"use client";

import { ActiveOrderBanner } from "./ActiveOrderBanner";
import { CheckoutStepBar } from "./CheckoutStepBar";
import { Toast } from "./Toast";
import { StudentBottomNav } from "./student/StudentBottomNav";
import { StudentMobileHeader } from "./student/StudentMobileHeader";
import { StudentOrdersPanel } from "./student/StudentOrdersPanel";
import { StudentProfilePanel } from "./student/StudentProfilePanel";
import { PickupAlertBanner } from "./student/PickupAlertBanner";
import { StudentMenuPanel } from "./student/panels/StudentMenuPanel";
import {
  StudentDesktopCartColumn,
  StudentMobileCartChrome,
} from "./student/panels/StudentCartPanel";
import {
  StudentCheckoutPanel,
  StudentReceiptPanel,
} from "./student/panels/StudentCheckoutPanel";
import { StockErrorAlert } from "./student/checkout/StockErrorAlert";
import { PageLoader } from "@/components/ui/Spinner";
import { useStudentApp } from "@/hooks/useStudentApp";

export function StudentApp() {
  const app = useStudentApp();

  if (app.loading || !app.user) {
    return <PageLoader label="Loading menu" />;
  }

  return (
    <div
      className={`mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-4 lg:py-6 ${app.mobilePadding}`}
    >
      <Toast message={app.toast} onDismiss={() => app.setToast(null)} />

      <div className="mb-4 hidden rounded-2xl bg-gradient-to-r from-primary to-amber-500 p-6 text-white lg:block">
        <h1 className="text-2xl font-bold">Pre-order meals</h1>
        <p className="mt-1 text-orange-100">
          Browse menu, pay online, collect with your pickup token
        </p>
      </div>

      {app.step === "menu" && <StudentMobileHeader />}

      {app.pickupAlert && app.step !== "receipt" && (
        <PickupAlertBanner
          alert={app.pickupAlert}
          onDismiss={() => app.setPickupAlert(null)}
        />
      )}

      {app.showCheckoutStepsDesktop && (
        <div className="hidden lg:block">
          <CheckoutStepBar currentStep={app.step} />
        </div>
      )}
      {app.showCheckoutStepsMobile && (
        <CheckoutStepBar currentStep={app.step} compact />
      )}

      {app.showActiveOrderInView && app.activeOrder && (
        <ActiveOrderBanner
          order={app.activeOrder}
          loading={app.receiptLoading}
          onViewReceipt={() => void app.openReceipt(app.activeOrder!.id)}
          onCancel={() => void app.cancelOrder(app.activeOrder!.id, "active")}
          cancelBusy={app.cancelBusy}
        />
      )}

      {app.step === "receipt" && app.paidOrder && (
        <StudentReceiptPanel
          order={app.paidOrder}
          cancelBusy={app.cancelBusy}
          onCancel={() => void app.cancelOrder(app.paidOrder!.id, "receipt")}
          onDone={app.finishReceipt}
        />
      )}

      {app.step !== "receipt" && (
        <div className="grid min-w-0 gap-6 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            {app.step === "menu" && app.mobileTab === "orders" && (
              <StudentOrdersPanel
                orders={app.orders}
                activeOrder={app.activeOrder}
                receiptLoading={app.receiptLoading}
                onOpenReceipt={(id) => void app.openReceipt(id)}
              />
            )}

            {app.step === "menu" && app.mobileTab === "profile" && app.user && (
              <StudentProfilePanel
                user={app.user}
                onLogout={() => void app.logout()}
              />
            )}

            {app.step === "menu" && app.mobileTab === "menu" && (
              <StudentMenuPanel
                filteredMenu={app.filteredMenu}
                categories={app.categories}
                categoryFilter={app.categoryFilter}
                dailySpecial={app.dailySpecial}
                lastOrderForReorder={app.lastOrderForReorder}
                busy={app.busy}
                getCartQty={app.getCartQty}
                onCategoryChange={app.setCategoryFilter}
                onAddToCart={app.addToCart}
                onUpdateQty={app.updateQty}
                onReorder={() => void app.reorderLastOrder()}
              />
            )}

            {(app.step === "review" || app.step === "payment") && (
              <StudentCheckoutPanel
                step={app.step}
                cart={app.cart}
                cartTotal={app.cartTotal}
                pendingOrder={app.pendingOrder}
                paymentMethod={app.paymentMethod}
                busy={app.busy}
                cancelBusy={app.cancelBusy}
                onEditCart={() => app.setStep("menu")}
                onConfirmOrder={() => void app.confirmOrder()}
                onSelectPaymentMethod={app.setPaymentMethod}
                onPay={() => void app.payOrder()}
                onCancelPayment={() =>
                  app.pendingOrder &&
                  void app.cancelOrder(app.pendingOrder.id, "payment")
                }
              />
            )}

            <StockErrorAlert error={app.error} stockErrors={app.stockErrors} />
          </div>

          <StudentDesktopCartColumn
            cart={app.cart}
            menu={app.menu}
            cartTotal={app.cartTotal}
            step={app.step}
            orders={app.orders}
            busy={app.busy}
            receiptLoading={app.receiptLoading}
            onUpdateQty={app.updateQty}
            onValidateAndReview={() => void app.validateAndReview()}
            onOpenReceipt={(id) => void app.openReceipt(id)}
          />
        </div>
      )}

      {app.step !== "receipt" && (
        <StudentMobileCartChrome
          cart={app.cart}
          menu={app.menu}
          cartTotal={app.cartTotal}
          cartItemCount={app.cartItemCount}
          step={app.step}
          busy={app.busy}
          cartSheetOpen={app.cartSheetOpen}
          showMobileCartBar={app.showMobileCartBar}
          showMobileBottomNav={app.showMobileBottomNav}
          onUpdateQty={app.updateQty}
          onValidateAndReview={() => void app.validateAndReview()}
          onConfirmOrder={() => void app.confirmOrder()}
          onOpenCartSheet={() => app.setCartSheetOpen(true)}
          onCloseCartSheet={() => app.setCartSheetOpen(false)}
        />
      )}

      {app.showMobileBottomNav && (
        <StudentBottomNav active={app.mobileTab} onChange={app.setMobileTab} />
      )}
    </div>
  );
}
