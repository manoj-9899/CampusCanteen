"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";

export function Toast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 2200);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <Alert
      variant="success"
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 z-[60] flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg lg:bottom-8"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
      {message}
    </Alert>
  );
}
