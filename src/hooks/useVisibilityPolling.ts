"use client";

import { useEffect, useRef } from "react";

/**
 * Runs callback on an interval only while the document tab is visible.
 * Also runs once when the tab becomes visible again (catch-up).
 */
export function useVisibilityPolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled: boolean
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const run = () => {
      if (document.visibilityState !== "visible") return;
      void callbackRef.current();
    };

    run();
    const interval = setInterval(run, intervalMs);

    const onVisibility = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, enabled]);
}
