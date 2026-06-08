"use client";

import { useEffect } from "react";

async function clearDevPwaState() {
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((reg) => reg.unregister()));
  }
}

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Service workers + caches from another localhost project break Chrome specifically.
    if (process.env.NODE_ENV !== "production") {
      void clearDevPwaState();
      return;
    }

    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // PWA is optional — ignore registration failures (e.g. insecure context)
    });
  }, []);

  return null;
}
