"use client";

export type StaffTab = "queue" | "verify" | "inventory" | "forecast";

const TABS: { id: StaffTab; label: string }[] = [
  { id: "queue", label: "Pickup queue" },
  { id: "verify", label: "Verify token" },
  { id: "inventory", label: "Inventory" },
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
        className="flex min-w-max gap-1 rounded-xl bg-slate-100 p-1 lg:min-w-0 lg:flex-wrap"
        role="tablist"
        aria-label="Staff sections"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active === id}
            onClick={() => onChange(id)}
            className={`min-h-10 shrink-0 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition sm:px-4 sm:text-sm ${
              active === id
                ? "bg-white text-orange-700 shadow-sm ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
