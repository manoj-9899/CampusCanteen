"use client";

import { WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function NetworkStatusBanner() {
  const { online } = useNetworkStatus();

  if (online) return null;

  return (
    <div
      role="status"
      className="z-40 border-b border-amber-300 bg-amber-100 px-4 py-2.5 text-center text-sm font-medium text-amber-950"
    >
      <span className="inline-flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
        You&apos;re offline — reconnect to place orders or refresh status
      </span>
    </div>
  );
}
