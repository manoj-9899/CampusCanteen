"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
} from "@/lib/order-notifications";

const DISMISS_KEY = "campus-canteen-notify-dismiss";

export function NotificationPermissionBanner({
  compact = false,
}: {
  /** Slim single-row layout for mobile menu */
  compact?: boolean;
}) {
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported" | "loading"
  >("loading");
  const [dismissed, setDismissed] = useState(true);

  const refresh = useCallback(() => {
    setPermission(getNotificationPermission());
  }, []);

  useEffect(() => {
    refresh();
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, [refresh]);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const enable = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") dismiss();
  };

  if (permission === "loading" || dismissed) return null;
  if (!isNotificationSupported()) return null;
  if (permission === "granted") return null;

  if (permission === "denied") {
    if (compact) {
      return (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <BellOff className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          <p className="min-w-0 flex-1 text-xs text-slate-600">
            Notifications blocked — enable in browser settings for pickup alerts.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 p-1 text-slate-400"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
        <BellOff className="h-5 w-5 shrink-0 text-slate-500" />
        <div className="flex-1">
          <p className="font-medium text-slate-700">Browser notifications blocked</p>
          <p className="mt-0.5 text-slate-500">
            Enable notifications in your browser settings to get alerted when your
            order is ready.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-slate-400 hover:text-slate-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
        <Bell className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
        <p className="min-w-0 flex-1 text-xs text-amber-950">
          Enable notifications for pickup alerts
        </p>
        <button
          type="button"
          onClick={() => void enable()}
          className="shrink-0 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900"
        >
          Enable
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-amber-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm">
      <Bell className="h-5 w-5 shrink-0 text-orange-600" />
      <div className="flex-1">
        <p className="font-medium text-orange-900">Get notified when food is ready</p>
        <p className="mt-0.5 text-orange-800">
          Allow notifications so you don&apos;t have to keep checking the app.
        </p>
        <button
          type="button"
          onClick={() => void enable()}
          className="mt-2 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
        >
          Enable notifications
        </button>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 text-orange-400 hover:text-orange-700"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
