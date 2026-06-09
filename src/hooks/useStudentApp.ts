"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import type { StudentMobileTab } from "@/components/student/StudentBottomNav";
import type { PaymentMethodId } from "@/components/student/checkout/StudentPaymentStep";
import type { PickupAlert } from "@/lib/order-status";
import { cartSyncMessage, reconcileCartWithMenu } from "@/lib/cart-sync";
import { ApiError, fetchJson, isOffline } from "@/lib/fetch-client";
import {
  notifyOrderCollected,
  notifyOrderReady,
} from "@/lib/order-notifications";
import { HOME_NAV_EVENT } from "@/lib/home-nav";
import {
  isPendingOrderExpired,
  PENDING_ORDER_EXPIRED_MESSAGE,
} from "@/lib/pending-order";
import {
  filterMenuByCategory,
  sortMenuCategories,
  studentMobilePadding,
  type StudentStep,
} from "@/lib/student-menu-utils";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import type { CartItem, MenuItem, Order, StockValidationError } from "@/types";

function formatApiError(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

export function useStudentApp() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [dailySpecial, setDailySpecial] = useState<MenuItem | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<StudentStep>("menu");
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [paidOrder, setPaidOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("UPI");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stockErrors, setStockErrors] = useState<StockValidationError[]>([]);
  const [pickupAlert, setPickupAlert] = useState<PickupAlert | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [mobileTab, setMobileTab] = useState<StudentMobileTab>("menu");
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const knownStatuses = useRef<Record<string, string>>({});
  const cartRef = useRef(cart);
  const pendingOrderRef = useRef(pendingOrder);
  const stepRef = useRef(step);
  cartRef.current = cart;
  pendingOrderRef.current = pendingOrder;
  stepRef.current = step;

  const syncExpiredPendingOrder = useCallback((list: Order[]) => {
    const pending = pendingOrderRef.current;
    if (!pending) return;

    const fresh = list.find((o) => o.id === pending.id);
    const expired =
      !fresh ||
      fresh.status === "CANCELLED" ||
      (fresh.status === "PENDING" &&
        fresh.paymentStatus === "PENDING" &&
        isPendingOrderExpired(fresh.createdAt));

    if (!expired) return;

    setPendingOrder(null);
    if (stepRef.current === "payment") {
      setStep("menu");
      setError(PENDING_ORDER_EXPIRED_MESSAGE);
      setToast("Your unpaid order expired after 15 minutes.");
    }
  }, []);

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
    const list = ordersData.orders ?? [];
    setOrders(list);
    syncExpiredPendingOrder(list);
    return items;
  }, [syncExpiredPendingOrder]);

  const applyMenuToCart = useCallback((items: MenuItem[], currentStep: StudentStep) => {
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
      syncExpiredPendingOrder(list);
    } catch {
      // silent background refresh
    }
  }, [step, syncExpiredPendingOrder]);

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

  useEffect(() => {
    for (const order of orders) {
      if (!knownStatuses.current[order.id]) {
        knownStatuses.current[order.id] = order.status;
      }
    }
  }, [orders]);

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

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const categories = useMemo(() => sortMenuCategories(menu), [menu]);
  const filteredMenu = useMemo(
    () => filterMenuByCategory(menu, categoryFilter),
    [menu, categoryFilter]
  );

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
  const mobilePadding = studentMobilePadding(
    step,
    showMobileCartBar,
    showMobileBottomNav
  );

  const getCartQty = (menuItemId: string) =>
    cart.find((c) => c.menuItemId === menuItemId)?.quantity ?? 0;

  const lastOrderForReorder = orders.find(
    (o) => o.paymentStatus === "PAID" && o.items && o.items.length > 0
  );

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
    if (added) setToast(`${item.imageEmoji} ${item.name} added to cart`);
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

  const cancelOrder = async (
    orderId: string,
    context: "payment" | "active" | "receipt"
  ) => {
    setCancelBusy(true);
    setError("");
    setStockErrors([]);
    try {
      await fetchJson<{ order: Order }>(`/api/orders/${orderId}/cancel`, {
        method: "POST",
      });
      if (context === "payment") {
        setPendingOrder(null);
        setStep("menu");
      }
      if (context === "receipt" || context === "active") {
        setPaidOrder(null);
        setStep("menu");
        setMobileTab("orders");
      }
      setToast("Order cancelled");
      await loadData();
    } catch (err) {
      setError(formatApiError(err, "Could not cancel order."));
    } finally {
      setCancelBusy(false);
    }
  };

  const payOrder = async () => {
    if (!pendingOrder) return;
    if (
      pendingOrder.status === "PENDING" &&
      pendingOrder.paymentStatus === "PENDING" &&
      isPendingOrderExpired(pendingOrder.createdAt)
    ) {
      setPendingOrder(null);
      setStep("menu");
      setError(PENDING_ORDER_EXPIRED_MESSAGE);
      setToast("Your unpaid order expired after 15 minutes.");
      return;
    }
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

  const finishReceipt = () => {
    setStep("menu");
    setPaidOrder(null);
    setMobileTab("orders");
  };

  return {
    user,
    loading,
    logout,
    menu,
    dailySpecial,
    orders,
    cart,
    step,
    pendingOrder,
    paidOrder,
    paymentMethod,
    busy,
    error,
    stockErrors,
    pickupAlert,
    toast,
    categoryFilter,
    receiptLoading,
    cancelBusy,
    mobileTab,
    cartSheetOpen,
    cartTotal,
    cartItemCount,
    categories,
    filteredMenu,
    activeOrder,
    showActiveOrderInView,
    showMobileBottomNav,
    showMobileCartBar,
    showCheckoutStepsDesktop,
    showCheckoutStepsMobile,
    mobilePadding,
    lastOrderForReorder,
    setToast,
    setPickupAlert,
    setCategoryFilter,
    setMobileTab,
    setCartSheetOpen,
    setStep,
    setPaymentMethod,
    getCartQty,
    openReceipt,
    addToCart,
    updateQty,
    validateAndReview,
    confirmOrder,
    reorderLastOrder,
    cancelOrder,
    payOrder,
    finishReceipt,
  };
}
