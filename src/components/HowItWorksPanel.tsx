"use client";

import { useState } from "react";
import { ChevronDown, CreditCard, HelpCircle, QrCode, UtensilsCrossed } from "lucide-react";

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
    description: "When ready, show your QR or token — staff will hand over your food.",
  },
] as const;

export function HowItWorksPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <HelpCircle className="h-5 w-5 text-orange-500" />
          How it works
        </span>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ol className="space-y-3 border-t border-slate-100 px-4 py-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                {index + 1}
              </span>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  <step.icon className="h-4 w-4 text-orange-500" />
                  {step.title}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
