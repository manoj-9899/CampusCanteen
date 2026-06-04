"use client";

import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "campus-canteen-pwa-install-dismiss";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsIos(isIosDevice());
    setInstalled(isStandaloneDisplay());
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") setInstalled(true);
    return outcome === "accepted";
  }, [deferred]);

  const canPrompt = Boolean(deferred) && !installed && !dismissed;
  const showIosInstallHint =
    isIos && !installed && !dismissed && !canPrompt;
  const showAndroidManualHint =
    !isIos && !installed && !dismissed && !canPrompt;

  return {
    canPrompt,
    showIosInstallHint,
    showAndroidManualHint,
    install,
    dismiss,
    installed,
    isIos,
  };
}
