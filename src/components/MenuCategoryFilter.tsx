"use client";

import { cn } from "@/lib/cn";

export function MenuCategoryFilter({
  categories,
  selected,
  onSelect,
}: {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}) {
  const options = ["All", ...categories];

  return (
    <div
      className="mb-0 flex max-w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Menu categories"
    >
      {options.map((cat) => {
        const isSelected = selected === cat;
        return (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(cat)}
            className={cn(
              "min-h-10 shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isSelected
                ? "bg-primary text-white shadow-sm"
                : "bg-surface text-muted ring-1 ring-border hover:bg-primary-light hover:text-primary"
            )}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
