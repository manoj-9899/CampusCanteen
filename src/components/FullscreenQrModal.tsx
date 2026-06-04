"use client";

import { Loader2, Sun, X } from "lucide-react";

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
      className="fixed inset-0 z-[100] flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fullscreen-qr-title"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <p id="fullscreen-qr-title" className="text-sm font-semibold text-slate-700">
          Show at pickup counter
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
        <p
          className={`text-sm font-semibold uppercase tracking-wide ${
            isReady ? "text-green-600" : "text-orange-600"
          }`}
        >
          {isReady ? "Ready for pickup" : "Pickup token"}
        </p>
        <p className="mt-2 font-mono text-5xl font-black tracking-wider text-orange-600 sm:text-6xl">
          {tokenNumber}
        </p>
        <p className="mt-1 font-mono text-sm text-slate-500">{orderCode}</p>

        <div className="mt-8 flex w-full max-w-sm flex-col items-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR code for token ${tokenNumber}`}
              className="aspect-square w-full max-w-[min(85vw,20rem)] rounded-2xl border-2 border-slate-200 bg-white p-2 shadow-md"
            />
          ) : (
            <div className="flex aspect-square w-full max-w-[min(85vw,20rem)] items-center justify-center rounded-2xl border bg-slate-50">
              <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
            </div>
          )}
        </div>

        <div className="mt-6 flex max-w-sm items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Sun className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p>
            Turn your screen <strong>brightness up</strong> so staff can scan the QR
            easily.
          </p>
        </div>
      </div>
    </div>
  );
}
