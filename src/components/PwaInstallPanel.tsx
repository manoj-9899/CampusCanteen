"use client";

import { CheckCircle2, Download, MoreVertical, Share, Smartphone, X } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export function PwaInstallPanel({
  variant = "compact",
  className = "",
}: {
  variant?: "compact" | "card";
  className?: string;
}) {
  const {
    canPrompt,
    showIosInstallHint,
    showAndroidManualHint,
    install,
    dismiss,
    installed,
  } = usePwaInstall();

  if (installed) {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-900 ${className}`}
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
        <span>Running as installed app</span>
      </div>
    );
  }

  if (!canPrompt && !showIosInstallHint && !showAndroidManualHint) {
    return null;
  }

  if (canPrompt) {
    if (variant === "compact") {
      return (
        <div
          className={`mb-3 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 ${className}`}
        >
          <Download className="h-4 w-4 shrink-0 text-orange-700" aria-hidden />
          <p className="min-w-0 flex-1 text-xs text-orange-950">
            Install CampusCanteen on your home screen for quick access.
          </p>
          <button
            type="button"
            onClick={() => void install()}
            className="shrink-0 rounded-md border border-orange-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-orange-800"
          >
            Install
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 text-orange-500 hover:text-orange-800"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      );
    }

    return (
      <div
        className={`flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm ${className}`}
      >
        <Download className="h-5 w-5 shrink-0 text-orange-700" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-orange-950">Install CampusCanteen</p>
          <p className="mt-1 text-orange-900">
            Add the app to your home screen — opens full screen like a native app (no Play
            Store needed).
          </p>
          <button
            type="button"
            onClick={() => void install()}
            className="mt-3 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Install app
          </button>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-orange-500"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (showIosInstallHint) {
    return (
      <div
        className={`flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm ${className}`}
      >
        <Smartphone className="h-5 w-5 shrink-0 text-orange-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">Add to Home Screen (iPhone)</p>
          <p className="mt-1 text-slate-600">
            In <strong>Safari</strong>, tap <Share className="inline h-3.5 w-3.5" /> Share →{" "}
            <strong>Add to Home Screen</strong>.
          </p>
        </div>
        <button type="button" onClick={dismiss} className="shrink-0 text-slate-400" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (showAndroidManualHint) {
    const body =
      variant === "compact" ? (
        <p className="min-w-0 flex-1 text-xs text-slate-700">
          Install: Chrome menu <MoreVertical className="inline h-3 w-3" /> →{" "}
          <strong>Add to Home screen</strong> (HTTPS works best).
        </p>
      ) : (
        <p className="mt-1 text-slate-600">
          On <strong>Chrome</strong>, open the menu <MoreVertical className="inline h-3.5 w-3.5" />{" "}
          → <strong>Add to Home screen</strong> or <strong>Install app</strong>. For a reliable
          install button, host the site on <strong>HTTPS</strong> (e.g. Vercel).
        </p>
      );

    return (
      <div
        className={`flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm ${variant === "card" ? "rounded-xl bg-white p-4 shadow-sm" : ""} ${className}`}
      >
        <Smartphone className="h-4 w-4 shrink-0 text-orange-600 sm:h-5 sm:w-5" aria-hidden />
        <div className="min-w-0 flex-1">
          {variant === "card" && (
            <p className="font-medium text-slate-900">Add to Home Screen (Android)</p>
          )}
          {body}
        </div>
        <button type="button" onClick={dismiss} className="shrink-0 text-slate-400" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return null;
}
