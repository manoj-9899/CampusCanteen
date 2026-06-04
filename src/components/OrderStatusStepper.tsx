"use client";

import { Check } from "lucide-react";
import { ORDER_TRACKING_STEPS, getActiveStepIndex } from "@/lib/order-status";

export function OrderStatusStepper({ status }: { status: string }) {
  const activeStep = getActiveStepIndex(status);

  return (
    <div className="mt-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                    className={`h-0.5 flex-1 ${
                      done || active ? "bg-orange-500" : "bg-slate-200"
                    }`}
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
                  {done ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                {index < ORDER_TRACKING_STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      done ? "bg-orange-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
              <p
                className={`mt-2 hidden text-center text-[10px] leading-tight sm:block ${
                  active
                    ? "font-semibold text-orange-600"
                    : done
                      ? "text-slate-600"
                      : "text-slate-400"
                }`}
              >
                {step.label}
              </p>
              <p
                className={`mt-2 text-center text-[10px] leading-tight sm:hidden ${
                  active
                    ? "font-semibold text-orange-600"
                    : done
                      ? "text-slate-600"
                      : "text-slate-400"
                }`}
              >
                {step.shortLabel}
              </p>
              {active && !upcoming && status !== "COMPLETED" && (
                <span className="mt-1 text-[10px] font-medium text-orange-500">
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
