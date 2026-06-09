"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Maximize2,
  PartyPopper,
  QrCode,
} from "lucide-react";
import { FullscreenQrModal } from "./FullscreenQrModal";
import { OrderStatusStepper } from "./OrderStatusStepper";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
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
  onCancel,
  cancelBusy,
}: {
  order: Order;
  onDone: () => void;
  onCancel?: () => void;
  cancelBusy?: boolean;
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

  useVisibilityPolling(pollOrder, 5000, order.status !== "COMPLETED");

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
  const canCancel =
    order.status === "CONFIRMED" && order.paymentStatus === "PAID";

  return (
    <>
      <Card className="mx-auto max-w-md border-green-200 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          {justReady && !isCompleted && (
            <Alert variant="success" className="mb-4 flex gap-3 p-4">
              <Bell className="h-6 w-6 shrink-0" aria-hidden />
              <div>
                <p className="font-bold">Your order is ready!</p>
                <p className="mt-1 text-sm">
                  Come to the pickup counter and show your QR or token{" "}
                  <span className="font-mono font-bold">{order.tokenNumber}</span>.
                </p>
              </div>
            </Alert>
          )}

          {justCompleted && isCompleted && (
            <Alert variant="info" className="mb-4 flex gap-3 p-4">
              <PartyPopper className="h-6 w-6 shrink-0" aria-hidden />
              <div>
                <p className="font-bold">Pickup confirmed!</p>
                <p className="mt-1 text-sm">
                  Staff has handed over your order. Thank you — enjoy your meal!
                </p>
              </div>
            </Alert>
          )}

          <div className="text-center">
            <p className="text-sm font-medium text-success">
              {isCompleted
                ? "Order collected"
                : isReady
                  ? "Ready for pickup!"
                  : "Order confirmed"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {isCompleted
                ? "Your food was picked up successfully"
                : isReady
                  ? "Your food is packed — show token at the counter"
                  : "Please wait while staff prepares your order"}
            </p>
            <p className="mt-4 text-4xl font-black tracking-wider text-primary sm:text-5xl">
              {order.tokenNumber}
            </p>
            <p className="text-sm text-muted">Token number</p>
          </div>

          <OrderStatusStepper status={order.status} />

          <div className="mt-6 space-y-2 rounded-2xl bg-surface-muted p-4 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted">Order ID</span>
              <span className="break-all text-right font-mono font-medium">
                {order.orderCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Amount paid</span>
              <span className="font-bold text-primary">₹{order.totalAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Payment</span>
              <span>{order.paymentMethod ?? "UPI"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="shrink-0 text-muted">Date &amp; time</span>
              <span className="text-right text-xs sm:text-sm">
                {new Date(order.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <ul className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-2">
                <span className="min-w-0">
                  {item.menuItem.imageEmoji} {item.menuItem.name} ×{item.quantity}
                </span>
                <span className="shrink-0">
                  ₹{item.unitPrice * item.quantity}
                </span>
              </li>
            ))}
          </ul>

          {!isCompleted && (
            <div className="mt-6 flex flex-col items-center">
              <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted">
                <QrCode className="h-4 w-4" aria-hidden />
                Show this QR at pickup
              </p>
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR for ${order.tokenNumber}`}
                  className="h-48 w-48 max-w-[min(85vw,12rem)] rounded-xl border border-border"
                  width={192}
                  height={192}
                  decoding="async"
                />
              ) : (
                <div className="flex h-48 w-48 max-w-[min(85vw,12rem)] items-center justify-center rounded-xl border border-border bg-surface-muted">
                  <Spinner label="Loading QR code" />
                </div>
              )}
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={() => setFullscreenQr(true)}
                disabled={!qrDataUrl}
                className="mt-4 max-w-sm border-primary/40 bg-primary-light text-primary hover:bg-orange-100"
              >
                <Maximize2 className="h-4 w-4" />
                Open full-screen QR
              </Button>
              <p className="mt-2 text-center text-xs text-muted">
                {isReady
                  ? "Food is ready — proceed to the counter"
                  : "We'll notify you when your order is ready"}
              </p>
            </div>
          )}

          {isCompleted && (
            <Alert variant="success" className="mt-6 flex items-center justify-center gap-2 py-3">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
              Pickup complete
            </Alert>
          )}

          {canCancel && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              loading={cancelBusy}
              onClick={onCancel}
              className="mt-4 text-muted"
            >
              Cancel order
            </Button>
          )}

          <Button size="lg" fullWidth onClick={onDone} className="mt-6">
            Back to menu
          </Button>
        </CardContent>
      </Card>

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
