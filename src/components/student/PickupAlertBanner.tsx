"use client";

import { Bell, PartyPopper, X } from "lucide-react";
import { type PickupAlert, pickupAlertMessage } from "@/lib/order-status";
import { cn } from "@/lib/cn";

export function PickupAlertBanner({
  alert,
  onDismiss,
}: {
  alert: PickupAlert;
  onDismiss: () => void;
}) {
  const { title, body } = pickupAlertMessage(alert);
  const isReady = alert.type === "ready";

  return (
    <div
      className={cn(
        "mb-4 flex items-start gap-3 rounded-2xl border p-4 shadow-sm",
        isReady
          ? "border-green-300 bg-green-50"
          : "border-blue-300 bg-blue-50"
      )}
      role="status"
    >
      {isReady ? (
        <Bell className="h-6 w-6 shrink-0 text-green-600" aria-hidden />
      ) : (
        <PartyPopper className="h-6 w-6 shrink-0 text-blue-600" aria-hidden />
      )}
      <div className="flex-1">
        <p
          className={cn(
            "font-bold",
            isReady ? "text-green-900" : "text-blue-900"
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "mt-1 text-sm",
            isReady ? "text-green-800" : "text-blue-800"
          )}
        >
          {body}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className={cn(
          "shrink-0 rounded-lg p-1 transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isReady
            ? "text-green-600 hover:text-green-800"
            : "text-blue-600 hover:text-blue-800"
        )}
        aria-label="Dismiss notification"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
