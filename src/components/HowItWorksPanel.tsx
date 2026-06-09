"use client";

import { useState } from "react";
import {
  ChevronDown,
  CreditCard,
  HelpCircle,
  QrCode,
  UtensilsCrossed,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const STEPS = [
  {
    icon: UtensilsCrossed,
    title: "Browse & pay",
    description: "Pick in-stock items, review your cart, and pay online.",
  },
  {
    icon: CreditCard,
    title: "Get your token",
    description: "Receive a token number and QR code on your receipt.",
  },
  {
    icon: QrCode,
    title: "Collect at counter",
    description:
      "When ready, show your QR or token — staff will hand over your food.",
  },
] as const;

export function HowItWorksPanel() {
  const [open, setOpen] = useState(false);

  return (
    <Card className="mb-4 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 px-4 py-3 text-left",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        )}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <HelpCircle className="h-5 w-5 text-primary" aria-hidden />
          How it works
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted transition",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      {open && (
        <CardContent className="border-t border-border px-4 py-4">
          <ol className="space-y-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary">
                  {index + 1}
                </span>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <step.icon className="h-4 w-4 text-primary" aria-hidden />
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      )}
    </Card>
  );
}
