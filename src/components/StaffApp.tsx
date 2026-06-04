"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  Loader2,
  Package,
  PackageCheck,
  QrCode,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "./AuthProvider";
import { InventoryItemCard } from "./staff/InventoryItemCard";
import { StaffForecastMobile } from "./staff/StaffForecastMobile";
import { StaffTabBar, type StaffTab } from "./staff/StaffTabBar";
import { StaffMobileHeader } from "./staff/StaffMobileHeader";
import { StaffQueueOrderCard } from "./staff/StaffQueueOrderCard";
import { StaffQueueSummary } from "./staff/StaffQueueSummary";
import { StaffVerifyMobile } from "./staff/StaffVerifyMobile";
import { InventoryStockControls } from "./staff/InventoryStockControls";
import { PwaInstallPanel } from "./PwaInstallPanel";
import { QrScanner } from "./QrScanner";
import { parseQrPayload, verifyPayloadBody } from "@/lib/qr";
import type { Forecast, MenuItem, Order } from "@/types";
import { HOME_NAV_EVENT } from "@/lib/home-nav";
import { fetchJson } from "@/lib/fetch-client";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";

export function StaffApp() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<StaffTab>("queue");
  const [queue, setQueue] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<MenuItem[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    ok: boolean;
    message: string;
    order?: Order;
    needsHandoverConfirm?: boolean;
    handoverComplete?: boolean;
  } | null>(null);
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

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadQueue(), loadInventory(), loadForecast()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadQueue, loadInventory, loadForecast]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user?.role === "STUDENT") router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === "STAFF") void loadAll();
  }, [user, loadAll]);

  useVisibilityPolling(loadQueue, 5000, user?.role === "STAFF");

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

  const submitVerify = useCallback(async (body: {
    tokenNumber?: string;
    orderCode?: string;
    orderId?: string;
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
        setVerifyResult({ ok: false, message: data.error ?? "Verification failed" });
      }
    } catch {
      setVerifyResult({ ok: false, message: "Network error" });
    } finally {
      setBusy(false);
    }
  }, [loadQueue]);

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
    patch: { addStock?: number; stockQuantity?: number }
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

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const chartData =
    forecast?.items.slice(0, 6).map((i) => ({
      name: i.menuItemName,
      predicted: i.predictedDemand,
      stock: i.currentStock,
    })) ?? [];

  const readyForPickupCount = queue.filter(
    (o) => o.status === "READY_FOR_PICKUP"
  ).length;

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-4 pb-8 sm:py-6">
      <StaffMobileHeader />

      <div className="mb-4 hidden items-center justify-between gap-3 sm:mb-6 lg:flex">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Canteen counter</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Pickup queue · token verification · inventory
          </p>
        </div>
        <button
          type="button"
          onClick={loadAll}
          disabled={refreshing}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="mb-4 flex items-center justify-end gap-3 lg:hidden">
        <button
          type="button"
          onClick={loadAll}
          disabled={refreshing}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <PwaInstallPanel variant="compact" className="mb-3 lg:hidden" />
      <PwaInstallPanel variant="card" className="mb-4 hidden lg:block" />

      <StaffTabBar active={tab} onChange={setTab} />

      {tab === "queue" && (
        <div>
          <StaffQueueSummary queue={queue} />
          <div className="space-y-3">
            {queue.map((order) => (
              <StaffQueueOrderCard
                key={order.id}
                order={order}
                busy={busy}
                onMarkReady={() => markReady(order.id)}
              />
            ))}
          </div>
        </div>
      )}

      {tab === "verify" && (
        <div className="max-w-lg rounded-xl border bg-white p-4 sm:p-6">
          <StaffVerifyMobile pendingCount={readyForPickupCount} />
          <h2 className="flex items-center gap-2 font-bold">
            <QrCode className="h-5 w-5 text-orange-500" />
            Verify pickup
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Scan the student&apos;s QR code or enter token / order ID manually
          </p>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setScanning((s) => !s);
                setVerifyResult(null);
              }}
              className={`flex min-h-11 w-full items-center justify-center rounded-lg text-sm font-semibold ${
                scanning
                  ? "bg-slate-800 text-white"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              }`}
            >
              {scanning ? "Hide scanner" : "Verify with QR"}
            </button>
          </div>

          {scanning ? (
            <QrScanner
              onScan={handleQrScan}
              onClose={() => setScanning(false)}
            />
          ) : (
            <div className="mt-4 flex flex-col items-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
              <QrCode className="mb-2 h-10 w-10 text-slate-300" aria-hidden />
              <p className="text-sm text-slate-600">
                Tap <strong>Verify with QR</strong> above
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Camera or photo scan for student receipt
              </p>
            </div>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">or enter manually</span>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
              placeholder="Token A154 or ORD-2026-54"
              className="min-h-11 flex-1 rounded-lg border px-3 py-2 font-mono uppercase"
            />
            <button
              type="button"
              onClick={verifyToken}
              disabled={busy}
              className="inline-flex min-h-11 min-w-[5.5rem] items-center justify-center gap-1 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Verify
            </button>
          </div>
          {verifyResult && (
            <div
              className={`mt-4 rounded-lg p-4 text-sm ${
                verifyResult.ok
                  ? verifyResult.handoverComplete
                    ? "bg-blue-50 text-blue-900"
                    : "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <div className="flex gap-2">
                {verifyResult.ok && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                <div className="flex-1">
                  <p>{verifyResult.message}</p>
                  {verifyResult.order && (
                    <>
                      <p className="mt-1 font-mono font-bold">
                        {verifyResult.order.tokenNumber} · {verifyResult.order.orderCode}
                      </p>
                      <p className="text-xs">
                        {verifyResult.order.user?.name}
                        {verifyResult.order.user?.studentId &&
                          ` · ${verifyResult.order.user.studentId}`}
                      </p>
                    </>
                  )}
                </div>
              </div>
              {verifyResult.order && (
                <ul className="mt-2 space-y-1 border-t border-green-200 pt-2">
                  {verifyResult.order.items.map((i) => (
                    <li key={i.id}>
                      {i.menuItem.imageEmoji} {i.menuItem.name} ×{i.quantity}
                    </li>
                  ))}
                </ul>
              )}
              {verifyResult.ok &&
                verifyResult.needsHandoverConfirm &&
                verifyResult.order &&
                !verifyResult.handoverComplete && (
                  <button
                    type="button"
                    onClick={() => confirmHandover(verifyResult.order!.id)}
                    disabled={busy}
                    className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-green-600 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PackageCheck className="h-5 w-5" />
                    )}
                    Confirm pickup — food handed over
                  </button>
                )}
            </div>
          )}
        </div>
      )}

      {tab === "inventory" && (
        <div className="rounded-xl border bg-white p-4 sm:p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <Package className="h-5 w-5 text-orange-500" />
            Menu availability
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Count what is left (e.g. <strong>17 samosas</strong>), type that number, and tap{" "}
            <strong>Update stock</strong>. Mark <strong>sold out</strong> when students should
            not order online.
          </p>

          <div className="mt-4 space-y-3 lg:hidden">
            {inventory.map((item) => (
              <InventoryItemCard
                key={item.id}
                item={item}
                busy={busy}
                onToggleAvailability={(available) =>
                  setAvailability(item.id, available)
                }
                onAddStock={(qty) => updateStock(item.id, { addStock: qty })}
                onSetStock={(qty) => updateStock(item.id, { stockQuantity: qty })}
              />
            ))}
          </div>

          <table className="mt-4 hidden w-full text-sm lg:table">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2">Item</th>
                <th className="pb-2">App stock</th>
                <th className="pb-2">Online orders</th>
                <th className="pb-2">Update stock</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className="border-b border-slate-50">
                  <td className="py-3">
                    {item.imageEmoji} {item.name}
                    {item.isDailySpecial && (
                      <span className="ml-1 text-xs text-amber-600">★ Special</span>
                    )}
                    <p className="mt-0.5 text-xs text-slate-400">
                      {item.availabilityLabel}
                    </p>
                  </td>
                  <td className="font-bold">{item.stockQuantity}</td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAvailability(item.id, true)}
                        disabled={busy || item.isAvailable}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          item.isAvailable
                            ? "bg-green-100 text-green-800"
                            : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                        } disabled:opacity-60`}
                      >
                        Available
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvailability(item.id, false)}
                        disabled={busy || !item.isAvailable}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          !item.isAvailable
                            ? "bg-red-100 text-red-800"
                            : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                        } disabled:opacity-60`}
                      >
                        Sold out
                      </button>
                    </div>
                  </td>
                  <td className="min-w-[12rem] py-3">
                    <InventoryStockControls
                      layout="compact"
                      busy={busy}
                      onAddStock={(qty) => updateStock(item.id, { addStock: qty })}
                      onSetStock={(qty) => updateStock(item.id, { stockQuantity: qty })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "forecast" && forecast && (
        <div className="space-y-6">
          <StaffForecastMobile forecast={forecast} />

          <div className="hidden gap-4 sm:grid-cols-2 lg:grid">
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-slate-500">Predicted orders (next day)</p>
              <p className="text-3xl font-bold">{forecast.totalPredictedOrders}</p>
            </div>
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-slate-500">Suggested prep focus</p>
              <p className="text-3xl font-bold text-orange-600">
                {forecast.items[0]?.menuItemName ?? "—"}
              </p>
            </div>
          </div>
          <div className="hidden rounded-xl border bg-white p-5 lg:block">
            <h3 className="mb-4 flex items-center gap-2 font-bold">
              <BarChart3 className="h-5 w-5" />
              Predicted demand vs current stock
            </h3>
            <div className="h-64 w-full min-w-0">
              {forecastChartReady && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={256} minWidth={0}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="predicted" fill="#f97316" name="Predicted" />
                    <Bar dataKey="stock" fill="#94a3b8" name="In stock" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  Loading chart…
                </div>
              )}
            </div>
          </div>
          <div className="hidden rounded-xl border bg-white p-5 lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th>Item</th>
                  <th>Predicted</th>
                  <th>Stock</th>
                  <th>Suggested batch</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {forecast.items.map((item) => (
                  <tr key={item.menuItemId} className="border-b border-slate-50">
                    <td className="py-2 font-medium">{item.menuItemName}</td>
                    <td>{item.predictedDemand}</td>
                    <td>{item.currentStock}</td>
                    <td className="text-orange-600">{item.suggestedPrep}</td>
                    <td>
                      {item.trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                      {item.trend === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
                      {item.trend === "stable" && <Minus className="h-4 w-4 text-slate-400" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
