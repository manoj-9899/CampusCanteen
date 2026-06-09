"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import type { MenuItemFormValues } from "@/components/staff/MenuItemForm";
import type { StaffTab } from "@/components/staff/StaffTabBar";
import type { VerifyResultState } from "@/components/staff/StaffVerifyPanel";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import { ApiError, fetchJson } from "@/lib/fetch-client";
import { HOME_NAV_EVENT } from "@/lib/home-nav";
import { getLowStockAlerts } from "@/lib/low-stock";
import { parseQrPayload, verifyPayloadBody } from "@/lib/qr";
import type { DailyAnalytics, Forecast, MenuItem, Order } from "@/types";

export function useStaffApp() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<StaffTab>("queue");
  const [queue, setQueue] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<MenuItem[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalytics | null>(
    null
  );
  const [tokenInput, setTokenInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResultState | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [forecastChartReady, setForecastChartReady] = useState(false);

  const loadQueue = useCallback(async () => {
    try {
      const data = await fetchJson<{ orders?: Order[] }>("/api/orders/queue");
      setQueue(data.orders ?? []);
    } catch {
      // keep last queue on transient failure
    }
  }, []);

  const loadInventory = useCallback(async () => {
    const data = await fetchJson<{ items?: MenuItem[] }>("/api/inventory");
    setInventory(data.items ?? []);
  }, []);

  const loadForecast = useCallback(async () => {
    const data = await fetchJson<{ forecast?: Forecast | null }>("/api/forecast");
    setForecast(data.forecast ?? null);
  }, []);

  const loadDailyAnalytics = useCallback(async () => {
    try {
      const data = await fetchJson<{ analytics?: DailyAnalytics }>(
        "/api/analytics/daily"
      );
      setDailyAnalytics(data.analytics ?? null);
    } catch {
      // keep last snapshot on transient failure
    }
  }, []);

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadQueue(),
        loadInventory(),
        loadForecast(),
        loadDailyAnalytics(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadQueue, loadInventory, loadForecast, loadDailyAnalytics]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user?.role === "STUDENT") router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === "STAFF") void loadAll();
  }, [user, loadAll]);

  useVisibilityPolling(loadQueue, 5000, user?.role === "STAFF");
  useVisibilityPolling(
    loadDailyAnalytics,
    30_000,
    user?.role === "STAFF" && tab === "sales"
  );

  useEffect(() => {
    const resetToHome = () => {
      setTab("queue");
      setScanning(false);
      setVerifyResult(null);
      setTokenInput("");
      void loadAll();
    };
    window.addEventListener(HOME_NAV_EVENT, resetToHome);
    return () => window.removeEventListener(HOME_NAV_EVENT, resetToHome);
  }, [loadAll]);

  useEffect(() => {
    if (tab !== "forecast") {
      setForecastChartReady(false);
      return;
    }
    const id = requestAnimationFrame(() => setForecastChartReady(true));
    return () => {
      cancelAnimationFrame(id);
      setForecastChartReady(false);
    };
  }, [tab]);

  const markReady = async (orderId: string) => {
    setBusy(true);
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "READY_FOR_PICKUP" }),
    });
    await loadQueue();
    setBusy(false);
  };

  const submitVerify = useCallback(
    async (body: {
      tokenNumber?: string;
      orderCode?: string;
      orderId?: string;
      pickupSecret?: string;
    }) => {
      setBusy(true);
      setVerifyResult(null);
      try {
        const res = await fetch("/api/orders/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (res.ok) {
          setVerifyResult({
            ok: true,
            message: data.message,
            order: data.order,
            needsHandoverConfirm: data.needsHandoverConfirm ?? true,
            handoverComplete: false,
          });
          setTokenInput("");
          setScanning(false);
          await loadQueue();
        } else {
          setVerifyResult({
            ok: false,
            message: data.error ?? "Verification failed",
          });
        }
      } catch {
        setVerifyResult({ ok: false, message: "Network error" });
      } finally {
        setBusy(false);
      }
    },
    [loadQueue]
  );

  const verifyToken = async () => {
    const token = tokenInput.trim().toUpperCase();
    if (!token) return;
    await submitVerify(
      token.startsWith("ORD") ? { orderCode: token } : { tokenNumber: token }
    );
  };

  const handleQrScan = useCallback(
    (raw: string) => {
      const payload = parseQrPayload(raw);
      if (!payload) {
        setVerifyResult({
          ok: false,
          message: "Invalid QR code. Ask the student to show the receipt QR.",
        });
        setScanning(false);
        return;
      }
      void submitVerify(verifyPayloadBody(payload));
    },
    [submitVerify]
  );

  const confirmHandover = async (orderId: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-handover`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setVerifyResult({
          ok: true,
          message: data.message,
          order: data.order,
          needsHandoverConfirm: false,
          handoverComplete: true,
        });
        await loadQueue();
      } else {
        setVerifyResult({
          ok: false,
          message: data.error ?? "Could not confirm pickup",
        });
      }
    } catch {
      setVerifyResult({ ok: false, message: "Network error" });
    } finally {
      setBusy(false);
    }
  };

  const updateStock = async (
    menuItemId: string,
    patch: {
      addStock?: number;
      stockQuantity?: number;
      lowStockThreshold?: number;
    }
  ) => {
    setBusy(true);
    try {
      await fetchJson("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId, ...patch }),
      });
      await loadInventory();
      await loadQueue();
    } finally {
      setBusy(false);
    }
  };

  const setAvailability = async (menuItemId: string, isAvailable: boolean) => {
    setBusy(true);
    try {
      await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId, isAvailable }),
      });
      await loadInventory();
    } finally {
      setBusy(false);
    }
  };

  const parseMenuForm = (values: MenuItemFormValues, includeStock: boolean) => {
    const price = Number(values.price);
    const stockQuantity = Number(values.stockQuantity);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Enter a valid price.");
    }
    if (includeStock && (!Number.isFinite(stockQuantity) || stockQuantity < 0)) {
      throw new Error("Enter a valid initial stock count.");
    }
    return {
      name: values.name.trim(),
      description: values.description.trim(),
      price,
      category: values.category.trim(),
      imageEmoji: values.imageEmoji.trim() || "🍽️",
      isAvailable: values.isAvailable,
      ...(includeStock ? { stockQuantity: Math.floor(stockQuantity) } : {}),
    };
  };

  const createMenuItem = async (values: MenuItemFormValues) => {
    setBusy(true);
    try {
      await fetchJson("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseMenuForm(values, true)),
      });
      await loadInventory();
    } catch (err) {
      throw new Error(
        err instanceof ApiError ? err.message : "Could not create item."
      );
    } finally {
      setBusy(false);
    }
  };

  const updateMenuItem = async (id: string, values: MenuItemFormValues) => {
    setBusy(true);
    try {
      await fetchJson(`/api/menu/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseMenuForm(values, false)),
      });
      await loadInventory();
    } catch (err) {
      throw new Error(
        err instanceof ApiError ? err.message : "Could not save changes."
      );
    } finally {
      setBusy(false);
    }
  };

  const deleteMenuItem = async (id: string) => {
    setBusy(true);
    try {
      await fetchJson(`/api/menu/${id}`, { method: "DELETE" });
      await loadInventory();
    } catch (err) {
      throw new Error(
        err instanceof ApiError ? err.message : "Could not delete item."
      );
    } finally {
      setBusy(false);
    }
  };

  const readyForPickupCount = queue.filter(
    (o) => o.status === "READY_FOR_PICKUP"
  ).length;

  const lowStockAlerts = getLowStockAlerts(inventory);

  return {
    user,
    loading,
    tab,
    queue,
    inventory,
    forecast,
    dailyAnalytics,
    tokenInput,
    scanning,
    verifyResult,
    refreshing,
    busy,
    forecastChartReady,
    readyForPickupCount,
    lowStockAlerts,
    setTab,
    setTokenInput,
    setScanning,
    setVerifyResult,
    loadAll,
    markReady,
    verifyToken,
    handleQrScan,
    confirmHandover,
    setAvailability,
    updateStock,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
  };
}
