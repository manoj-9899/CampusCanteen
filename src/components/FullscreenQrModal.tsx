"use client";

import { Sun, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

export function FullscreenQrModal({
  tokenNumber,
  orderCode,
  qrDataUrl,
  isReady,
  onClose,
}: {
  tokenNumber: string;
  orderCode: string;
  qrDataUrl: string | null;
  isReady: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-surface"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fullscreen-qr-title"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p id="fullscreen-qr-title" className="text-sm font-semibold text-foreground">
          Show at pickup counter
        </p>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          aria-label="Close"
          className="h-9 w-9 min-h-9 min-w-9"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
        <p
          className={cn(
            "text-sm font-semibold uppercase tracking-wide",
            isReady ? "text-success" : "text-primary"
          )}
        >
          {isReady ? "Ready for pickup" : "Pickup token"}
        </p>
        <p className="mt-2 font-mono text-5xl font-black tracking-wider text-primary sm:text-6xl">
          {tokenNumber}
        </p>
        <p className="mt-1 font-mono text-sm text-muted">{orderCode}</p>

        <div className="mt-8 flex w-full max-w-sm flex-col items-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR code for token ${tokenNumber}`}
              className="aspect-square w-full max-w-[min(85vw,20rem)] rounded-2xl border-2 border-border bg-white p-2 shadow-md"
            />
          ) : (
            <div className="flex aspect-square w-full max-w-[min(85vw,20rem)] items-center justify-center rounded-2xl border border-border bg-surface-muted">
              <Spinner label="Loading QR code" />
            </div>
          )}
        </div>

        <Alert variant="warning" className="mt-6 flex max-w-sm items-start gap-2 p-4">
          <Sun className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>
            Turn your screen <strong>brightness up</strong> so staff can scan the
            QR easily.
          </p>
        </Alert>
      </div>
    </div>
  );
}
