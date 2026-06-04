"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // PWA is optional — ignore registration failures (e.g. insecure context)
    });
  }, []);

  return null;
}
