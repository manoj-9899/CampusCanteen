"use client";

import { Check } from "lucide-react";
import { ORDER_TRACKING_STEPS, getActiveStepIndex } from "@/lib/order-status";
import { cn } from "@/lib/cn";

export function OrderStatusStepper({ status }: { status: string }) {
  const activeStep = getActiveStepIndex(status);

  return (
    <div className="mt-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Order progress
      </p>
      <div className="flex items-start justify-between gap-1">
        {ORDER_TRACKING_STEPS.map((step, index) => {
          const stepNum = index + 1;
          const done = activeStep > stepNum;
          const active = activeStep === stepNum;
          const upcoming = activeStep < stepNum;

          return (
            <div key={step.label} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {index > 0 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1",
                      done || active ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    done && "bg-primary text-white",
                    active && "bg-primary text-white ring-4 ring-primary-light",
                    upcoming && "bg-border text-muted"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                {index < ORDER_TRACKING_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1",
                      done ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>
              <p
                className={cn(
                  "mt-2 hidden text-center text-[10px] leading-tight sm:block",
                  active && "font-semibold text-primary",
                  done && !active && "text-foreground",
                  upcoming && "text-muted"
                )}
              >
                {step.label}
              </p>
              <p
                className={cn(
                  "mt-2 text-center text-[10px] leading-tight sm:hidden",
                  active && "font-semibold text-primary",
                  done && !active && "text-foreground",
                  upcoming && "text-muted"
                )}
              >
                {step.shortLabel}
              </p>
              {active && !upcoming && status !== "COMPLETED" && (
                <span className="mt-1 text-[10px] font-medium text-primary">
                  Current
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
