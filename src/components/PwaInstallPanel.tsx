"use client";

import {
  CheckCircle2,
  Download,
  MoreVertical,
  Share,
  Smartphone,
  X,
} from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

function DismissButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-lg p-1 text-muted transition hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
      aria-label="Dismiss"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export function PwaInstallPanel({
  variant = "compact",
  className = "",
}: {
  variant?: "compact" | "card";
  className?: string;
}) {
  const {
    canPrompt,
    showIosInstallHint,
    showAndroidManualHint,
    install,
    dismiss,
    installed,
  } = usePwaInstall();

  if (installed) {
    return (
      <Alert
        variant="success"
        className={cn("flex items-center gap-2 px-3 py-2 text-xs", className)}
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
        <span>Running as installed app</span>
      </Alert>
    );
  }

  if (!canPrompt && !showIosInstallHint && !showAndroidManualHint) {
    return null;
  }

  if (canPrompt) {
    if (variant === "compact") {
      return (
        <Alert
          variant="warning"
          className={cn(
            "mb-3 flex items-center gap-2 border-primary/30 bg-primary-light px-3 py-2.5 text-xs text-foreground",
            className
          )}
        >
          <Download className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <p className="min-w-0 flex-1">
            Install CampusCanteen on your home screen for quick access.
          </p>
          <Button size="sm" variant="outline" onClick={() => void install()}>
            Install
          </Button>
          <DismissButton onClick={dismiss} />
        </Alert>
      );
    }

    return (
      <Card className={cn("border-primary/30 bg-primary-light", className)}>
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <Download className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">Install CampusCanteen</p>
            <p className="mt-1 text-muted">
              Add the app to your home screen — opens full screen like a native
              app (no Play Store needed).
            </p>
            <Button onClick={() => void install()} className="mt-3">
              Install app
            </Button>
          </div>
          <DismissButton onClick={dismiss} />
        </CardContent>
      </Card>
    );
  }

  if (showIosInstallHint) {
    return (
      <Card className={className}>
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <Smartphone className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">
              Add to Home Screen (iPhone)
            </p>
            <p className="mt-1 text-muted">
              In <strong>Safari</strong>, tap{" "}
              <Share className="inline h-3.5 w-3.5" aria-hidden /> Share →{" "}
              <strong>Add to Home Screen</strong>.
            </p>
          </div>
          <DismissButton onClick={dismiss} />
        </CardContent>
      </Card>
    );
  }

  if (showAndroidManualHint) {
    const body =
      variant === "compact" ? (
        <p className="min-w-0 flex-1 text-xs text-muted">
          Install: Chrome menu <MoreVertical className="inline h-3 w-3" /> →{" "}
          <strong>Add to Home screen</strong> (HTTPS works best).
        </p>
      ) : (
        <p className="mt-1 text-muted">
          On <strong>Chrome</strong>, open the menu{" "}
          <MoreVertical className="inline h-3.5 w-3.5" /> →{" "}
          <strong>Add to Home screen</strong> or <strong>Install app</strong>.
          For a reliable install button, host the site on{" "}
          <strong>HTTPS</strong> (e.g. Netlify).
        </p>
      );

    return (
      <Card
        className={cn(
          variant === "compact" ? "bg-surface-muted" : "",
          className
        )}
      >
        <CardContent
          className={cn(
            "flex items-start gap-2 text-sm",
            variant === "compact" ? "px-3 py-2.5" : "gap-3 p-4"
          )}
        >
          <Smartphone
            className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            {variant === "card" && (
              <p className="font-medium text-foreground">
                Add to Home Screen (Android)
              </p>
            )}
            {body}
          </div>
          <DismissButton onClick={dismiss} />
        </CardContent>
      </Card>
    );
  }

  return null;
}
