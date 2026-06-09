"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
} from "@/lib/order-notifications";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const DISMISS_KEY = "campus-canteen-notify-dismiss";

function DismissButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-lg p-1 text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Dismiss"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export function NotificationPermissionBanner({
  compact = false,
}: {
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
        <Alert
          variant="info"
          className="mb-3 flex items-center gap-2 px-3 py-2 text-xs"
        >
          <BellOff className="h-4 w-4 shrink-0" aria-hidden />
          <p className="min-w-0 flex-1">
            Notifications blocked — enable in browser settings for pickup alerts.
          </p>
          <DismissButton onClick={dismiss} />
        </Alert>
      );
    }

    return (
      <Card className="mb-4">
        <CardContent className="flex items-start gap-3 p-3 text-sm">
          <BellOff className="h-5 w-5 shrink-0 text-muted" aria-hidden />
          <div className="flex-1">
            <p className="font-medium text-foreground">
              Browser notifications blocked
            </p>
            <p className="mt-0.5 text-muted">
              Enable notifications in your browser settings to get alerted when
              your order is ready.
            </p>
          </div>
          <DismissButton onClick={dismiss} />
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Alert
        variant="warning"
        className="mb-3 flex items-center gap-2 px-3 py-2 text-xs"
      >
        <Bell className="h-4 w-4 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1">Enable notifications for pickup alerts</p>
        <Button size="sm" variant="outline" onClick={() => void enable()}>
          Enable
        </Button>
        <DismissButton onClick={dismiss} />
      </Alert>
    );
  }

  return (
    <Card className={cn("mb-4 border-primary/30 bg-primary-light")}>
      <CardContent className="flex items-start gap-3 p-3 text-sm">
        <Bell className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="flex-1">
          <p className="font-medium text-foreground">
            Get notified when food is ready
          </p>
          <p className="mt-0.5 text-muted">
            Allow notifications so you don&apos;t have to keep checking the app.
          </p>
          <Button size="sm" onClick={() => void enable()} className="mt-2">
            Enable notifications
          </Button>
        </div>
        <DismissButton onClick={dismiss} />
      </CardContent>
    </Card>
  );
}
