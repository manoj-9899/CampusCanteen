"use client";

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
    <div className="mb-0 flex max-w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onSelect(cat)}
          className={`min-h-10 shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
            selected === cat
              ? "bg-orange-500 text-white shadow-sm"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-orange-50"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
