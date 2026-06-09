"use client";

import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const STEPS = [
  { id: "menu", label: "Menu" },
  { id: "review", label: "Review" },
  { id: "payment", label: "Pay" },
  { id: "receipt", label: "Receipt" },
] as const;

export type CheckoutStep = (typeof STEPS)[number]["id"];

export function CheckoutStepBar({
  currentStep,
  compact = false,
}: {
  currentStep: CheckoutStep;
  compact?: boolean;
}) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
  const active = STEPS[currentIndex] ?? STEPS[0];

  if (compact) {
    return (
      <p
        className="mb-4 text-sm text-muted lg:hidden"
        aria-label={`Checkout step ${currentIndex + 1} of ${STEPS.length}: ${active.label}`}
      >
        Step {currentIndex + 1} of {STEPS.length}
        <span className="text-border-strong"> · </span>
        <span className="font-semibold text-primary">{active.label}</span>
      </p>
    );
  }

  return (
    <nav aria-label="Checkout progress" className="mb-6 hidden lg:block">
      <Card>
        <CardContent className="px-3 py-4">
          <ol className="flex items-center justify-between gap-1">
            {STEPS.map((step, index) => {
              const done = index < currentIndex;
              const isActive = index === currentIndex;

              return (
                <li key={step.id} className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    {index > 0 && (
                      <div
                        className={cn(
                          "h-0.5 flex-1",
                          done ? "bg-primary" : "bg-border"
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        done && "bg-primary text-white",
                        isActive &&
                          "bg-primary text-white ring-4 ring-primary-light",
                        !done && !isActive && "bg-border text-muted"
                      )}
                    >
                      {done ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "h-0.5 flex-1",
                          done ? "bg-primary" : "bg-border"
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-[10px] font-medium sm:text-xs",
                      isActive && "text-primary",
                      done && !isActive && "text-foreground",
                      !done && !isActive && "text-muted"
                    )}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </nav>
  );
}
