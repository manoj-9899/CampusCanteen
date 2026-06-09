"use client";

import { cn } from "@/lib/cn";

export type StaffTab =
  | "queue"
  | "verify"
  | "menu"
  | "inventory"
  | "sales"
  | "forecast";

const TABS: { id: StaffTab; label: string }[] = [
  { id: "queue", label: "Pickup queue" },
  { id: "verify", label: "Verify token" },
  { id: "menu", label: "Menu" },
  { id: "inventory", label: "Inventory" },
  { id: "sales", label: "Today's sales" },
  { id: "forecast", label: "Forecast" },
];

export function StaffTabBar({
  active,
  onChange,
}: {
  active: StaffTab;
  onChange: (tab: StaffTab) => void;
}) {
  return (
    <div className="mb-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div
        className="flex min-w-max gap-1 rounded-xl bg-surface-muted p-1 lg:min-w-0 lg:flex-wrap"
        role="tablist"
        aria-label="Staff sections"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active === id}
            aria-controls={`staff-panel-${id}`}
            id={`staff-tab-${id}`}
            onClick={() => onChange(id)}
            className={cn(
              "min-h-10 shrink-0 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition sm:px-4 sm:text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              active === id
                ? "bg-surface text-primary shadow-sm ring-1 ring-border"
                : "text-muted hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
