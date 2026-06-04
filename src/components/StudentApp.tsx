"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ChevronRight,
  Loader2,
  Minus,
  PartyPopper,
  Plus,
  RotateCcw,
  ShoppingCart,
  Sparkles,
  Bell,
  X,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { MenuItemRow } from "./student/MenuItemRow";
import {
  StudentBottomNav,
  type StudentMobileTab,
} from "./student/StudentBottomNav";
import { StudentOrdersPanel } from "./student/StudentOrdersPanel";
import { StudentProfilePanel } from "./student/StudentProfilePanel";
import { MobileCartSheet } from "./student/MobileCartSheet";
import { StudentMobileHeader } from "./student/StudentMobileHeader";
import { ActiveOrderBanner } from "./ActiveOrderBanner";
import { BottomCartBar } from "./BottomCartBar";
import { PwaInstallPanel } from "./PwaInstallPanel";
import { CheckoutStepBar } from "./CheckoutStepBar";
import { MenuCategoryFilter } from "./MenuCategoryFilter";
import { OrderReceipt } from "./OrderReceipt";
import { Toast } from "./Toast";
import type { CartItem, MenuItem, Order, StockValidationError } from "@/types";
import { HOME_NAV_EVENT } from "@/lib/home-nav";
import { type PickupAlert, pickupAlertMessage } from "@/lib/order-status";
import { cartSyncMessage, reconcileCartWithMenu } from "@/lib/cart-sync";
import { ApiError, fetchJson, isOffline } from "@/lib/fetch-client";
import {
  notifyOrderCollected,
  notifyOrderReady,
} from "@/lib/order-notifications";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import { HowItWorksPanel } from "./HowItWorksPanel";
import { NotificationPermissionBanner } from "./NotificationPermissionBanner";

type Step = "menu" | "review" | "payment" | "receipt";

const PAYMENT_METHODS = [
  { id: "UPI", label: "UPI" },
  { id: "GOOGLE_PAY", label: "Google Pay" },
  { id: "PHONEPE", label: "PhonePe" },
  { id: "PAYTM", label: "Paytm" },
  { id: "CARD", label: "Debit/Credit Card" },
] as const;

export function StudentApp() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [dailySpecial, setDailySpecial] = useState<MenuItem | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<Step>("menu");
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [paidOrder, setPaidOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof PAYMENT_METHODS)[number]["id"]>("UPI");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stockErrors, setStockErrors] = useState<StockValidationError[]>([]);
  const [pickupAlert, setPickupAlert] = useState<PickupAlert | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<StudentMobileTab>("menu");
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const knownStatuses = useRef<Record<string, string>>({});
  const cartRef = useRef(cart);
  cartRef.current = cart;

  const formatApiError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError) return err.message;
    return fallback;
  };

  const loadData = useCallback(async () => {
    const [menuData, ordersData] = await Promise.all([
      fetchJson<{ items?: MenuItem[]; dailySpecial?: MenuItem | null }>(
        "/api/menu"
      ),
      fetchJson<{ orders?: Order[] }>("/api/orders"),
    ]);
    const items: MenuItem[] = menuData.items ?? [];
    setMenu(items);
    setDailySpecial(menuData.dailySpecial ?? null);
    setOrders(ordersData.orders ?? []);
    return items;
  }, []);

  const applyMenuToCart = useCallback((items: MenuItem[], currentStep: Step) => {
    const prev = cartRef.current;
    if (prev.length === 0) return;

    const sync = reconcileCartWithMenu(prev, items);
    const message = cartSyncMessage(sync);
    if (message) setError(message);
    if (currentStep === "review" && sync.cart.length === 0) setStep("menu");

    const unchanged =
      sync.cart.length === prev.length &&
      sync.cart.every(
        (c, i) =>
          c.menuItemId === prev[i]?.menuItemId && c.quantity === prev[i]?.quantity
      );
    if (!unchanged) setCart(sync.cart);
  }, []);

  const pollMenuOnly = useCallback(async () => {
    try {
      const menuData = await fetchJson<{
        items?: MenuItem[];
        dailySpecial?: MenuItem | null;
      }>("/api/menu");
      const items: MenuItem[] = menuData.items ?? [];
      setMenu(items);
      setDailySpecial(menuData.dailySpecial ?? null);
      applyMenuToCart(items, step);
    } catch {
      // silent background refresh
    }
  }, [applyMenuToCart, step]);

  const pollOrdersOnly = useCallback(async () => {
    try {
      const ordersData = await fetchJson<{ orders?: Order[] }>("/api/orders");
      const list = ordersData.orders ?? [];

      for (const order of list) {
        const prev = knownStatuses.current[order.id];
        if (prev) {
          if (
            prev !== "READY_FOR_PICKUP" &&
            order.status === "READY_FOR_PICKUP"
          ) {
            notifyOrderReady(order.tokenNumber, order.id);
            if (step !== "receipt") {
              setPickupAlert({
                type: "ready",
                tokenNumber: order.tokenNumber,
                orderCode: order.orderCode,
              });
            }
          } else if (prev !== "COMPLETED" && order.status === "COMPLETED") {
            notifyOrderCollected(order.tokenNumber, order.id);
            if (step !== "receipt") {
              setPickupAlert({
                type: "collected",
                tokenNumber: order.tokenNumber,
                orderCode: order.orderCode,
              });
            }
          }
        }
        knownStatuses.current[order.id] = order.status;
      }

      setOrders(list);
    } catch {
      // silent background refresh
    }
  }, [step]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user?.role === "STAFF") router.replace("/staff");
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === "STUDENT") {
      void loadData()
        .then((items) => {
          if (items) applyMenuToCart(items, step);
        })
        .catch((err) => {
          setError(formatApiError(err, "Could not load menu."));
        });
    }
  }, [user, loadData, applyMenuToCart]);

  const needsMenuPoll =
    user?.role === "STUDENT" &&
    (cart.length > 0 || step === "review" || step === "payment");

  useVisibilityPolling(pollMenuOnly, 5000, needsMenuPoll);
  useVisibilityPolling(pollOrdersOnly, 5000, user?.role === "STUDENT");

  // Seed status map when orders first load
  useEffect(() => {
    for (const order of orders) {
      if (!knownStatuses.current[order.id]) {
        knownStatuses.current[order.id] = order.status;
      }
    }
  }, [orders]);

  // Auto-dismiss pickup notification after 8 seconds
  useEffect(() => {
    if (!pickupAlert) return;
    const timer = setTimeout(() => setPickupAlert(null), 8000);
    return () => clearTimeout(timer);
  }, [pickupAlert]);

  useEffect(() => {
    if (cart.length === 0) setCartSheetOpen(false);
  }, [cart.length]);

  useEffect(() => {
    const resetToHome = () => {
      setStep("menu");
      setCart([]);
      setPaidOrder(null);
      setPendingOrder(null);
      setError("");
      setStockErrors([]);
      setPickupAlert(null);
      setMobileTab("menu");
      void loadData();
    };
    window.addEventListener(HOME_NAV_EVENT, resetToHome);
    return () => window.removeEventListener(HOME_NAV_EVENT, resetToHome);
  }, [loadData]);

  useEffect(() => {
    if (cart.length === 0) setCartSheetOpen(false);
  }, [cart.length]);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const categories = useMemo(() => {
    const cats = [...new Set(menu.map((m) => m.category))];
    const preferred = ["Snacks", "Breakfast", "Beverages", "Special"];
    return cats.sort((a, b) => {
      const ia = preferred.indexOf(a);
      const ib = preferred.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [menu]);

  const filteredMenu =
    categoryFilter === "All"
      ? menu
      : menu.filter((m) => m.category === categoryFilter);

  const activeOrder = orders.find(
    (o) =>
      o.paymentStatus === "PAID" &&
      (o.status === "CONFIRMED" || o.status === "READY_FOR_PICKUP")
  );

  const showActiveOrderBanner =
    activeOrder &&
    !(step === "receipt" && paidOrder?.id === activeOrder.id);

  const showActiveOrderInView =
    showActiveOrderBanner &&
    activeOrder &&
    (step !== "menu" || mobileTab !== "profile");

  const showMobileBottomNav = step === "menu";

  const showMobileCartBar =
    cartItemCount > 0 && (step === "menu" || step === "review");

  const showCheckoutStepsDesktop =
    step === "menu" ||
    step === "review" ||
    step === "payment" ||
    step === "receipt";

  const showCheckoutStepsMobile = step === "review" || step === "payment";

  const getCartQty = (menuItemId: string) =>
    cart.find((c) => c.menuItemId === menuItemId)?.quantity ?? 0;

  const mobilePadding = (() => {
    if (step === "receipt") return "";
    if (step === "review" || step === "payment") {
      return showMobileCartBar
        ? "pb-24 lg:pb-6"
        : "pb-6 lg:pb-6";
    }
    if (showMobileCartBar) {
      return "pb-[calc(7.25rem+env(safe-area-inset-bottom))] lg:pb-6";
    }
    if (showMobileBottomNav) {
      return "pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-6";
    }
    return "lg:pb-6";
  })();

  const openReceipt = async (orderId: string) => {
    setReceiptLoading(true);
    setError("");
    try {
      const data = await fetchJson<{ order: Order }>(`/api/orders/${orderId}`);
      setPaidOrder(data.order);
      setStep("receipt");
      setPendingOrder(null);
    } catch (err) {
      setError(formatApiError(err, "Could not load order."));
    } finally {
      setReceiptLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    if (!item.canOrder) return;
    let added = false;
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      const max = item.stockQuantity;
      if (existing) {
        if (existing.quantity >= max) return prev;
        added = true;
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      added = true;
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          imageEmoji: item.imageEmoji,
          maxQuantity: max,
        },
      ];
    });
    if (added) {
      setToast(`${item.imageEmoji} ${item.name} added to cart`);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.menuItemId !== id) return c;
          const next = c.quantity + delta;
          if (next > c.maxQuantity) return c;
          return { ...c, quantity: next };
        })
        .filter((c) => c.quantity > 0)
    );
  };

  const validateAndReview = async () => {
    if (cart.length === 0) {
      setError("Add items to your cart first.");
      return;
    }
    if (isOffline()) {
      setError("You are offline. Connect to the internet to continue.");
      return;
    }
    setBusy(true);
    setError("");
    setStockErrors([]);
    try {
      const data = await fetchJson<{
        valid?: boolean;
        errors?: StockValidationError[];
      }>("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((c) => ({
            menuItemId: c.menuItemId,
            quantity: c.quantity,
          })),
        }),
      });
      if (!data.valid) {
        setStockErrors(data.errors ?? []);
        setError(data.errors?.[0]?.message ?? "Some items are unavailable.");
        await loadData();
        return;
      }
      setStep("review");
      setCartSheetOpen(false);
    } catch (err) {
      setError(formatApiError(err, "Could not verify stock. Try again."));
    } finally {
      setBusy(false);
    }
  };

  const confirmOrder = async () => {
    if (isOffline()) {
      setError("You are offline. Connect to the internet to continue.");
      return;
    }
    setBusy(true);
    setError("");
    setStockErrors([]);
    try {
      const data = await fetchJson<{
        order: Order;
        errors?: StockValidationError[];
        error?: string;
      }>("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((c) => ({
            menuItemId: c.menuItemId,
            quantity: c.quantity,
          })),
        }),
      });
      setPendingOrder(data.order);
      setStep("payment");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(err.message);
        setTimeout(() => router.replace("/login"), 2000);
        return;
      }
      if (err instanceof ApiError && err.status === 409 && err.data?.errors) {
        setStockErrors(err.data.errors as StockValidationError[]);
      }
      setError(formatApiError(err, "Order failed."));
      await loadData().catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  const reorderLastOrder = async () => {
    setError("");
    setStockErrors([]);
    setBusy(true);
    try {
      const [menuData, ordersData] = await Promise.all([
        fetchJson<{ items?: MenuItem[] }>("/api/menu"),
        fetchJson<{ orders?: Order[] }>("/api/orders"),
      ]);
      const freshMenu: MenuItem[] = menuData.items ?? [];
      const freshOrders: Order[] = ordersData.orders ?? [];
      setMenu(freshMenu);
      setOrders(freshOrders);

      const lastOrder = freshOrders.find(
        (o) =>
          o.paymentStatus === "PAID" &&
          o.status !== "CANCELLED" &&
          o.items &&
          o.items.length > 0
      );

      if (!lastOrder) {
        setError("No previous order found to reorder.");
        return;
      }

      const newCart: CartItem[] = [];
      const unavailable: string[] = [];

      for (const line of lastOrder.items) {
        const menuItem = freshMenu.find((m) => m.id === line.menuItem.id);
        if (!menuItem || !menuItem.canOrder) {
          unavailable.push(line.menuItem.name);
          continue;
        }
        const quantity = Math.min(line.quantity, menuItem.stockQuantity);
        if (quantity < 1) {
          unavailable.push(line.menuItem.name);
          continue;
        }
        newCart.push({
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity,
          imageEmoji: menuItem.imageEmoji,
          maxQuantity: menuItem.stockQuantity,
        });
      }

      if (newCart.length === 0) {
        setError(
          unavailable.length
            ? `Cannot reorder — unavailable: ${unavailable.join(", ")}`
            : "Cannot reorder last order."
        );
        return;
      }

      setCart(newCart);
      setStep("menu");
      if (unavailable.length > 0) {
        setError(
          `Some items were skipped (out of stock): ${unavailable.join(", ")}`
        );
      }
    } catch (err) {
      setError(formatApiError(err, "Could not load your last order."));
    } finally {
      setBusy(false);
    }
  };

  const lastOrderForReorder = orders.find(
    (o) => o.paymentStatus === "PAID" && o.items && o.items.length > 0
  );

  const payOrder = async () => {
    if (!pendingOrder) return;
    if (isOffline()) {
      setError("You are offline. Connect to the internet to pay.");
      return;
    }
    setBusy(true);
    setError("");
    setStockErrors([]);
    try {
      const data = await fetchJson<{ order: Order; success?: boolean }>(
        "/api/payments",
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: pendingOrder.id,
          method: paymentMethod,
        }),
        timeoutMs: 30_000,
        }
      );
      setPaidOrder(data.order);
      setCart([]);
      setPendingOrder(null);
      setStep("receipt");
      await loadData();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.data?.errors) {
        setStockErrors(err.data.errors as StockValidationError[]);
      }
      setError(formatApiError(err, "Payment could not be completed."));
      await loadData().catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div
      className={`mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-4 lg:py-6 ${mobilePadding}`}
    >
      <Toast message={toast} onDismiss={() => setToast(null)} />

      <div className="mb-4 hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white lg:block">
        <h1 className="text-2xl font-bold">Smart Canteen</h1>
        <p className="mt-1 text-orange-100">
          Order ready-to-eat food — pay online, collect with your token
        </p>
      </div>

      {step === "menu" && <StudentMobileHeader />}

      {pickupAlert && step !== "receipt" && (() => {
        const { title, body } = pickupAlertMessage(pickupAlert);
        const isReady = pickupAlert.type === "ready";
        return (
          <div
            className={`mb-4 flex items-start gap-3 rounded-xl border p-4 shadow-sm ${
              isReady
                ? "border-green-300 bg-green-50"
                : "border-blue-300 bg-blue-50"
            }`}
          >
            {isReady ? (
              <Bell className="h-6 w-6 shrink-0 text-green-600" />
            ) : (
              <PartyPopper className="h-6 w-6 shrink-0 text-blue-600" />
            )}
            <div className="flex-1">
              <p
                className={`font-bold ${isReady ? "text-green-900" : "text-blue-900"}`}
              >
                {title}
              </p>
              <p
                className={`mt-1 text-sm ${isReady ? "text-green-800" : "text-blue-800"}`}
              >
                {body}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPickupAlert(null)}
              className={`shrink-0 ${isReady ? "text-green-600 hover:text-green-800" : "text-blue-600 hover:text-blue-800"}`}
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        );
      })()}

      {showCheckoutStepsDesktop && (
        <div className="hidden lg:block">
          <CheckoutStepBar currentStep={step} />
        </div>
      )}
      {showCheckoutStepsMobile && (
        <CheckoutStepBar currentStep={step} compact />
      )}

      {showActiveOrderInView && activeOrder && (
        <ActiveOrderBanner
          order={activeOrder}
          loading={receiptLoading}
          onViewReceipt={() => void openReceipt(activeOrder.id)}
        />
      )}

      {step === "receipt" && paidOrder && (
        <OrderReceipt
          order={paidOrder}
          onDone={() => {
            setStep("menu");
            setPaidOrder(null);
            setMobileTab("orders");
          }}
        />
      )}

      {step !== "receipt" && (
        <div className="grid min-w-0 gap-6 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            {step === "menu" && mobileTab === "orders" && (
              <StudentOrdersPanel
                orders={orders}
                activeOrder={activeOrder}
                receiptLoading={receiptLoading}
                onOpenReceipt={(id) => void openReceipt(id)}
              />
            )}

            {step === "menu" && mobileTab === "profile" && user && (
              <StudentProfilePanel user={user} onLogout={() => void logout()} />
            )}

            {step === "menu" && mobileTab === "menu" && (
              <>
                <div className="min-w-0 space-y-2.5 lg:hidden">
                  <PwaInstallPanel variant="compact" />
                  <NotificationPermissionBanner compact />

                  {lastOrderForReorder && (
                    <button
                      type="button"
                      onClick={() => void reorderLastOrder()}
                      disabled={busy}
                      className="flex w-full items-center gap-2 rounded-lg bg-slate-100 px-3 py-2.5 text-left disabled:opacity-60"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-orange-500" />
                      ) : (
                        <RotateCcw className="h-4 w-4 shrink-0 text-slate-500" />
                      )}
                      <span className="min-w-0 flex-1 text-xs text-slate-600">
                        Reorder last:{" "}
                        {lastOrderForReorder.items
                          .map((i) => `${i.menuItem.name}×${i.quantity}`)
                          .join(", ")}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  )}

                  {dailySpecial && (
                    <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-amber-900">
                          Today&apos;s special
                        </p>
                        <p className="truncate text-sm font-medium text-slate-900">
                          {dailySpecial.imageEmoji} {dailySpecial.name}
                        </p>
                      </div>
                      <p className="shrink-0 text-base font-bold text-orange-600">
                        ₹{dailySpecial.price}
                      </p>
                    </div>
                  )}

                  <div className="sticky top-0 z-10 rounded-lg bg-orange-50/95 py-2 backdrop-blur-sm">
                    <MenuCategoryFilter
                      categories={categories}
                      selected={categoryFilter}
                      onSelect={setCategoryFilter}
                    />
                  </div>

                  <div className="min-w-0 overflow-hidden rounded-xl border bg-white px-3 py-1 shadow-sm">
                    {filteredMenu.length === 0 ? (
                      <p className="py-8 text-center text-sm text-slate-500">
                        No items in this category.
                      </p>
                    ) : (
                      filteredMenu.map((item) => (
                        <MenuItemRow
                          key={item.id}
                          item={item}
                          quantity={getCartQty(item.id)}
                          onAdd={() => addToCart(item)}
                          onIncrement={() => addToCart(item)}
                          onDecrement={() => updateQty(item.id, -1)}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div className="hidden lg:block">
                  <NotificationPermissionBanner />
                  <HowItWorksPanel />

                  {lastOrderForReorder && (
                    <button
                      type="button"
                      onClick={() => void reorderLastOrder()}
                      disabled={busy}
                      className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 py-3 text-sm font-semibold text-orange-800 transition hover:bg-orange-100 disabled:opacity-60"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Reorder last meal (
                      {lastOrderForReorder.items
                        .map((i) => `${i.menuItem.name}×${i.quantity}`)
                        .join(", ")
                        .slice(0, 40)}
                      {lastOrderForReorder.items.length > 2 ? "…" : ""})
                    </button>
                  )}

                  {dailySpecial && (
                    <div className="mb-4 flex items-start gap-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
                      <Sparkles className="h-6 w-6 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                          Today&apos;s Special
                        </p>
                        <p className="text-lg font-bold text-slate-900">
                          {dailySpecial.imageEmoji} {dailySpecial.name} — ₹
                          {dailySpecial.price}
                        </p>
                        <p className="text-sm text-amber-800">
                          {dailySpecial.availabilityLabel}
                        </p>
                      </div>
                    </div>
                  )}

                  <MenuCategoryFilter
                    categories={categories}
                    selected={categoryFilter}
                    onSelect={setCategoryFilter}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    {filteredMenu.length === 0 ? (
                      <p className="col-span-2 py-8 text-center text-sm text-slate-500">
                        No items in this category.
                      </p>
                    ) : null}
                    {filteredMenu.map((item) => (
                      <div
                        key={item.id}
                        className={`flex gap-3 rounded-xl border bg-white p-4 shadow-sm ${
                          !item.canOrder ? "opacity-60" : ""
                        } ${item.isDailySpecial ? "ring-2 ring-amber-200" : ""}`}
                      >
                        <span className="text-4xl">{item.imageEmoji}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{item.name}</h3>
                          <p className="text-xs text-slate-500">{item.description}</p>
                          <p className="mt-1 text-lg font-bold text-orange-600">
                            ₹{item.price}
                          </p>
                          <p
                            className={`text-xs font-medium ${
                              !item.canOrder
                                ? "text-red-600"
                                : item.stockStatus === "low"
                                  ? "text-amber-600"
                                  : "text-green-600"
                            }`}
                          >
                            {item.availabilityLabel}
                          </p>
                          {item.canOrder && (
                            <p className="text-xs text-slate-400">
                              {item.stockQuantity} in stock
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => addToCart(item)}
                            disabled={!item.canOrder}
                            className="touch-target-sm mt-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {item.canOrder ? "Add to cart" : "Unavailable"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === "review" && (
              <div className="rounded-xl border bg-white p-6">
                <h2 className="text-lg font-bold">Order summary</h2>
                <ul className="mt-4 space-y-2">
                  {cart.map((item) => (
                    <li key={item.menuItemId} className="flex justify-between text-sm">
                      <span>
                        {item.imageEmoji} {item.name} × {item.quantity}
                      </span>
                      <span>₹{item.price * item.quantity}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex justify-between border-t pt-3 font-bold">
                  <span>Total</span>
                  <span className="text-orange-600">₹{cartTotal}</span>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setStep("menu")}
                    className="rounded-lg border px-4 py-2 text-sm"
                  >
                    Edit cart
                  </button>
                  <button
                    onClick={confirmOrder}
                    disabled={busy}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirm order
                  </button>
                </div>
              </div>
            )}

            {step === "payment" && pendingOrder && (
              <div className="rounded-xl border bg-white p-6">
                <h2 className="text-lg font-bold">Online payment</h2>
                <p className="text-sm text-slate-500">
                  {pendingOrder.orderCode} · ₹{pendingOrder.totalAmount}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Availability is checked again when you pay
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`rounded-lg border py-2 text-sm font-medium ${
                        paymentMethod === m.id
                          ? "border-orange-400 bg-orange-50 text-orange-700"
                          : "border-slate-200"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={payOrder}
                  disabled={busy}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying stock & processing...
                    </>
                  ) : (
                    `Pay ₹${pendingOrder.totalAmount}`
                  )}
                </button>
              </div>
            )}

            {(error || stockErrors.length > 0) && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <div>
                    {error && <p>{error}</p>}
                    <ul className="mt-1 list-disc pl-4">
                      {stockErrors.map((e) => (
                        <li key={e.menuItemId}>{e.message}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="hidden space-y-4 lg:block">
            <div className="sticky top-20 rounded-xl border bg-white p-4 shadow-sm">
              <h2 className="flex items-center gap-2 font-bold">
                <ShoppingCart className="h-5 w-5 text-orange-500" />
                Cart ({cart.length})
              </h2>
              {cart.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Cart is empty</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {cart.map((item) => {
                    const live = menu.find((m) => m.id === item.menuItemId);
                    const unavailable = !live?.canOrder;
                    return (
                    <li key={item.menuItemId} className="flex items-center gap-2">
                      <span>{item.imageEmoji}</span>
                      <div className="flex-1 text-sm">
                        <p
                          className={`font-medium ${unavailable ? "text-slate-400 line-through" : ""}`}
                        >
                          {item.name}
                        </p>
                        {unavailable ? (
                          <p className="text-xs font-medium text-red-600">
                            Sold out — removing from cart…
                          </p>
                        ) : (
                          <p className="text-orange-600">₹{item.price * item.quantity}</p>
                        )}
                      </div>
                      {!unavailable && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateQty(item.menuItemId, -1)}
                          className="touch-target-sm flex items-center justify-center rounded-lg border p-2"
                          aria-label={`Decrease ${item.name}`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-5 text-center text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.menuItemId, 1)}
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
                  })}
                </ul>
              )}
              <div className="mt-4 border-t pt-3">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-orange-600">₹{cartTotal}</span>
                </div>
                {step === "menu" && cart.length > 0 && (
                  <button
                    onClick={validateAndReview}
                    disabled={busy}
                    className="mt-3 hidden w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2 text-sm font-semibold text-white disabled:opacity-60 lg:flex"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    Review order
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-bold">Order history</h3>
              <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                {orders.map((order) => {
                  const canOpenReceipt =
                    order.paymentStatus === "PAID" &&
                    order.status !== "CANCELLED" &&
                    order.status !== "PENDING";
                  return (
                    <li key={order.id}>
                      <button
                        type="button"
                        onClick={() =>
                          canOpenReceipt && void openReceipt(order.id)
                        }
                        disabled={!canOpenReceipt || receiptLoading}
                        className={`w-full rounded-lg bg-slate-50 p-3 text-left text-sm transition ${
                          canOpenReceipt
                            ? "hover:bg-orange-50 hover:ring-1 hover:ring-orange-200"
                            : "cursor-default opacity-70"
                        }`}
                      >
                        <div className="flex justify-between">
                          <span className="font-mono font-bold text-orange-600">
                            {order.tokenNumber}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              order.status === "COMPLETED"
                                ? "text-blue-700"
                                : order.status === "READY_FOR_PICKUP"
                                  ? "text-green-700"
                                  : "text-slate-500"
                            }`}
                          >
                            {order.status === "COMPLETED"
                              ? "Collected ✓"
                              : order.status === "READY_FOR_PICKUP"
                                ? "Ready"
                                : order.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{order.orderCode}</p>
                        <p className="text-xs text-slate-600">
                          ₹{order.totalAmount}
                          {canOpenReceipt && (
                            <span className="ml-2 text-orange-600">
                              · Tap for receipt
                            </span>
                          )}
                        </p>
                      </button>
                    </li>
                  );
                })}
                {orders.length === 0 && (
                  <p className="text-sm text-slate-500">No orders yet</p>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <MobileCartSheet
        open={cartSheetOpen}
        cart={cart}
        menu={menu}
        total={cartTotal}
        busy={busy}
        onClose={() => setCartSheetOpen(false)}
        onReview={() => void validateAndReview()}
        onUpdateQty={updateQty}
      />

      {showMobileCartBar && (
        <BottomCartBar
          itemCount={cartItemCount}
          total={cartTotal}
          busy={busy}
          aboveBottomNav={showMobileBottomNav}
          primaryLabel={step === "review" ? "Confirm order" : "Review order"}
          onOpenCart={step === "menu" ? () => setCartSheetOpen(true) : undefined}
          onPrimary={() =>
            step === "review" ? void confirmOrder() : void validateAndReview()
          }
        />
      )}

      {showMobileBottomNav && (
        <StudentBottomNav active={mobileTab} onChange={setMobileTab} />
      )}
    </div>
  );
}
