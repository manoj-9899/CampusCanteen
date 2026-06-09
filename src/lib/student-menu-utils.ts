import type { MenuItem } from "@/types";

const PREFERRED_CATEGORIES = ["Snacks", "Breakfast", "Beverages", "Special"];

export function sortMenuCategories(menu: MenuItem[]): string[] {
  const cats = [...new Set(menu.map((m) => m.category))];
  return cats.sort((a, b) => {
    const ia = PREFERRED_CATEGORIES.indexOf(a);
    const ib = PREFERRED_CATEGORIES.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export function filterMenuByCategory(
  menu: MenuItem[],
  categoryFilter: string
): MenuItem[] {
  return categoryFilter === "All"
    ? menu
    : menu.filter((m) => m.category === categoryFilter);
}

export type StudentStep = "menu" | "review" | "payment" | "receipt";

export function studentMobilePadding(
  step: StudentStep,
  showMobileCartBar: boolean,
  showMobileBottomNav: boolean
): string {
  if (step === "receipt") return "";
  if (step === "review" || step === "payment") {
    return showMobileCartBar ? "pb-24 lg:pb-6" : "pb-6 lg:pb-6";
  }
  if (showMobileCartBar) {
    return "pb-[calc(7.25rem+env(safe-area-inset-bottom))] lg:pb-6";
  }
  if (showMobileBottomNav) {
    return "pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-6";
  }
  return "lg:pb-6";
}
