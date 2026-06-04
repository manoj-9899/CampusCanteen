"use client";

import { Receipt, UtensilsCrossed, User } from "lucide-react";

export type StudentMobileTab = "menu" | "orders" | "profile";

export function StudentBottomNav({
  active,
  onChange,
}: {
  active: StudentMobileTab;
  onChange: (tab: StudentMobileTab) => void;
}) {
  const items: { id: StudentMobileTab; label: string; icon: typeof UtensilsCrossed }[] =
    [
      { id: "menu", label: "Menu", icon: UtensilsCrossed },
      { id: "orders", label: "Orders", icon: Receipt },
      { id: "profile", label: "Profile", icon: User },
    ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Student navigation"
    >
      <div className="mx-auto flex max-w-lg">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 ${
              active === id ? "text-orange-600" : "text-slate-400"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={active === id ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
