"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Loader2,
  Maximize2,
  PartyPopper,
  QrCode,
} from "lucide-react";
import { FullscreenQrModal } from "./FullscreenQrModal";
import { OrderStatusStepper } from "./OrderStatusStepper";
import { fetchJson } from "@/lib/fetch-client";
import {
  notifyOrderCollected,
  notifyOrderReady,
} from "@/lib/order-notifications";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import type { Order } from "@/types";

export function OrderReceipt({
  order: initialOrder,
  onDone,
}: {
  order: Order;
  onDone: () => void;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [justReady, setJustReady] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [fullscreenQr, setFullscreenQr] = useState(false);
  const prevStatus = useRef(initialOrder.status);

  useEffect(() => {
    fetchJson<{ qrDataUrl?: string }>(`/api/orders/${initialOrder.id}/qr`)
      .then((d) => setQrDataUrl(d.qrDataUrl ?? null))
      .catch(() => setQrDataUrl(null));
  }, [initialOrder.id]);

  useEffect(() => {
    if (!fullscreenQr) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreenQr]);

  const pollOrder = useCallback(async () => {
    if (order.status === "COMPLETED") return;

    try {
      const data = await fetchJson<{ order: Order }>(
        `/api/orders/${initialOrder.id}`
      );
      const updated = data.order;
      const prev = prevStatus.current;

      if (prev !== "READY_FOR_PICKUP" && updated.status === "READY_FOR_PICKUP") {
        setJustReady(true);
        notifyOrderReady(updated.tokenNumber, updated.id);
      }
      if (prev !== "COMPLETED" && updated.status === "COMPLETED") {
        setJustCompleted(true);
        setJustReady(false);
        notifyOrderCollected(updated.tokenNumber, updated.id);
      }

      prevStatus.current = updated.status;
      setOrder(updated);
    } catch {
      // keep last known state on background poll failure
    }
  }, [initialOrder.id, order.status]);

  useVisibilityPolling(
    pollOrder,
    5000,
    order.status !== "COMPLETED"
  );

  useEffect(() => {
    if (!justReady) return;
    const timer = setTimeout(() => setJustReady(false), 8000);
    return () => clearTimeout(timer);
  }, [justReady]);

  useEffect(() => {
    if (!justCompleted) return;
    const timer = setTimeout(() => setJustCompleted(false), 8000);
    return () => clearTimeout(timer);
  }, [justCompleted]);

  const isCompleted = order.status === "COMPLETED";
  const isReady = order.status === "READY_FOR_PICKUP";

  return (
    <>
      <div className="mx-auto max-w-md rounded-2xl border border-green-200 bg-white p-4 shadow-lg sm:p-6">
        {justReady && !isCompleted && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-green-300 bg-green-50 p-4">
            <Bell className="h-6 w-6 shrink-0 text-green-600" />
            <div>
              <p className="font-bold text-green-900">Your order is ready!</p>
              <p className="mt-1 text-sm text-green-800">
                Come to the pickup counter and show your QR or token{" "}
                <span className="font-mono font-bold">{order.tokenNumber}</span>.
              </p>
            </div>
          </div>
        )}

        {justCompleted && isCompleted && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <PartyPopper className="h-6 w-6 shrink-0 text-blue-600" />
            <div>
              <p className="font-bold text-blue-900">Pickup confirmed!</p>
              <p className="mt-1 text-sm text-blue-800">
                Staff has handed over your order. Thank you — enjoy your meal!
              </p>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-sm font-medium text-green-600">
            {isCompleted
              ? "Order collected"
              : isReady
                ? "Ready for pickup!"
                : "Order confirmed"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {isCompleted
              ? "Your food was picked up successfully"
              : isReady
                ? "Your food is packed — show token at the counter"
                : "Please wait while staff prepares your order"}
          </p>
          <p className="mt-4 text-4xl font-black tracking-wider text-orange-600 sm:text-5xl">
            {order.tokenNumber}
          </p>
          <p className="text-sm text-slate-500">Token number</p>
        </div>

        <OrderStatusStepper status={order.status} />

        <div className="mt-6 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Order ID</span>
            <span className="break-all text-right font-mono font-medium">
              {order.orderCode}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Amount paid</span>
            <span className="font-bold text-orange-600">₹{order.totalAmount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Payment</span>
            <span>{order.paymentMethod ?? "UPI"}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="shrink-0 text-slate-500">Date & time</span>
            <span className="text-right text-xs sm:text-sm">
              {new Date(order.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        <ul className="mt-4 space-y-1 border-t pt-4 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span className="min-w-0">
                {item.menuItem.imageEmoji} {item.menuItem.name} ×{item.quantity}
              </span>
              <span className="shrink-0">₹{item.unitPrice * item.quantity}</span>
            </li>
          ))}
        </ul>

        {!isCompleted && (
          <div className="mt-6 flex flex-col items-center">
            <p className="mb-2 flex items-center gap-1 text-xs font-medium text-slate-500">
              <QrCode className="h-4 w-4" />
              Show this QR at pickup
            </p>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR for ${order.tokenNumber}`}
                className="h-48 w-48 max-w-[min(85vw,12rem)] rounded-lg border"
                width={192}
                height={192}
                decoding="async"
              />
            ) : (
              <div className="flex h-48 w-48 max-w-[min(85vw,12rem)] items-center justify-center rounded-lg border bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setFullscreenQr(true)}
              disabled={!qrDataUrl}
              className="touch-target mt-4 inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-xl border-2 border-orange-300 bg-orange-50 py-3.5 text-sm font-semibold text-orange-800 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Maximize2 className="h-4 w-4" />
              Open full-screen QR
            </button>
            <p className="mt-2 text-center text-xs text-slate-400">
              {isReady
                ? "Food is ready — proceed to the counter"
                : "We'll notify you when your order is ready"}
            </p>
          </div>
        )}

        {isCompleted && (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-green-50 py-3 text-sm font-medium text-green-800">
            <CheckCircle2 className="h-5 w-5" />
            Pickup complete
          </div>
        )}

        <button
          type="button"
          onClick={onDone}
          className="touch-target mt-6 w-full rounded-lg bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Back to menu
        </button>
      </div>

      {fullscreenQr && (
        <FullscreenQrModal
          tokenNumber={order.tokenNumber}
          orderCode={order.orderCode}
          qrDataUrl={qrDataUrl}
          isReady={isReady}
          onClose={() => setFullscreenQr(false)}
        />
      )}
    </>
  );
}
