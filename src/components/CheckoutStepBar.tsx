"use client";

import { Check } from "lucide-react";

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
  /** Single-line progress for mobile checkout */
  compact?: boolean;
}) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
  const active = STEPS[currentIndex] ?? STEPS[0];

  if (compact) {
    return (
      <p
        className="mb-4 text-sm text-slate-600 lg:hidden"
        aria-label={`Checkout step ${currentIndex + 1} of ${STEPS.length}: ${active.label}`}
      >
        Step {currentIndex + 1} of {STEPS.length}
        <span className="text-slate-400"> · </span>
        <span className="font-semibold text-orange-600">{active.label}</span>
      </p>
    );
  }

  return (
    <nav
      aria-label="Checkout progress"
      className="mb-6 rounded-xl border bg-white px-3 py-4 shadow-sm"
    >
      <ol className="flex items-center justify-between gap-1">
        {STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;

          return (
            <li key={step.id} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {index > 0 && (
                  <div
                    className={`h-0.5 flex-1 ${done ? "bg-orange-500" : "bg-slate-200"}`}
                  />
                )}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done
                      ? "bg-orange-500 text-white"
                      : active
                        ? "bg-orange-500 text-white ring-4 ring-orange-100"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      done ? "bg-orange-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
              <span
                className={`mt-2 text-[10px] font-medium sm:text-xs ${
                  active ? "text-orange-600" : done ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
