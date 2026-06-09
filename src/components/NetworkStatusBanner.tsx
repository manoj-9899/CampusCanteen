"use client";

import { WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Alert } from "@/components/ui/Alert";

export function NetworkStatusBanner() {
  const { online } = useNetworkStatus();

  if (online) return null;

  return (
    <Alert
      variant="warning"
      role="status"
      className="z-40 rounded-none border-x-0 border-t-0 py-2.5 text-center text-sm font-medium"
    >
      <span className="inline-flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
        You&apos;re offline — reconnect to place orders or refresh status
      </span>
    </Alert>
  );
}
