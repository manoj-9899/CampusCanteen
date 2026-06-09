"use client";

import { ChevronRight, RotateCcw, Sparkles, UtensilsCrossed } from "lucide-react";
import { MenuItemRow } from "../MenuItemRow";
import { DesktopMenuCard } from "../DesktopMenuCard";
import { MenuCategoryFilter } from "@/components/MenuCategoryFilter";
import { HowItWorksPanel } from "@/components/HowItWorksPanel";
import { NotificationPermissionBanner } from "@/components/NotificationPermissionBanner";
import { PwaInstallPanel } from "@/components/PwaInstallPanel";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { MenuItem, Order } from "@/types";

export function StudentMenuPanel({
  filteredMenu,
  categories,
  categoryFilter,
  dailySpecial,
  lastOrderForReorder,
  busy,
  getCartQty,
  onCategoryChange,
  onAddToCart,
  onUpdateQty,
  onReorder,
}: {
  filteredMenu: MenuItem[];
  categories: string[];
  categoryFilter: string;
  dailySpecial: MenuItem | null;
  lastOrderForReorder?: Order;
  busy: boolean;
  getCartQty: (menuItemId: string) => number;
  onCategoryChange: (category: string) => void;
  onAddToCart: (item: MenuItem) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onReorder: () => void;
}) {
  return (
    <>
      <div className="min-w-0 space-y-2.5 lg:hidden">
        <PwaInstallPanel variant="compact" />
        <NotificationPermissionBanner compact />

        {lastOrderForReorder && (
          <Button
            variant="secondary"
            fullWidth
            loading={busy}
            onClick={onReorder}
            className="justify-between px-3 text-left"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              {!busy && (
                <RotateCcw className="h-4 w-4 shrink-0 text-muted" />
              )}
              <span className="truncate text-xs font-normal">
                Reorder last:{" "}
                {lastOrderForReorder.items
                  .map((i) => `${i.menuItem.name}×${i.quantity}`)
                  .join(", ")}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
          </Button>
        )}

        {dailySpecial && (
          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-900">
                Today&apos;s special
              </p>
              <p className="truncate text-sm font-medium text-slate-900">
                {dailySpecial.imageEmoji} {dailySpecial.name}
              </p>
            </div>
            <p className="shrink-0 text-base font-bold text-orange-600">
              ₹{dailySpecial.price}
            </p>
          </div>
        )}

        <div className="sticky top-0 z-10 rounded-lg bg-orange-50/95 py-2 backdrop-blur-sm">
          <MenuCategoryFilter
            categories={categories}
            selected={categoryFilter}
            onSelect={onCategoryChange}
          />
        </div>

        <Card className="min-w-0 overflow-hidden">
          <CardContent className="px-3 py-1">
            {filteredMenu.length === 0 ? (
              <EmptyState
                className="my-4 border-none bg-transparent"
                icon={UtensilsCrossed}
                title="No items here"
                description="Try another category or check back later."
              />
            ) : (
              filteredMenu.map((item) => (
                <MenuItemRow
                  key={item.id}
                  item={item}
                  quantity={getCartQty(item.id)}
                  onAdd={() => onAddToCart(item)}
                  onIncrement={() => onAddToCart(item)}
                  onDecrement={() => onUpdateQty(item.id, -1)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:block">
        <NotificationPermissionBanner />
        <HowItWorksPanel />

        {lastOrderForReorder && (
          <Button
            variant="outline"
            fullWidth
            loading={busy}
            onClick={onReorder}
            className="mb-4 border-primary/30 bg-primary-light text-primary hover:bg-orange-100"
          >
            {!busy && <RotateCcw className="h-4 w-4" />}
            Reorder last meal (
            {lastOrderForReorder.items
              .map((i) => `${i.menuItem.name}×${i.quantity}`)
              .join(", ")
              .slice(0, 40)}
            {lastOrderForReorder.items.length > 2 ? "…" : ""})
          </Button>
        )}

        {dailySpecial && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
            <Sparkles className="h-6 w-6 shrink-0 text-amber-600" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                Today&apos;s Special
              </p>
              <p className="text-lg font-bold text-slate-900">
                {dailySpecial.imageEmoji} {dailySpecial.name} — ₹
                {dailySpecial.price}
              </p>
              <p className="text-sm text-amber-800">
                {dailySpecial.availabilityLabel}
              </p>
            </div>
          </div>
        )}

        <MenuCategoryFilter
          categories={categories}
          selected={categoryFilter}
          onSelect={onCategoryChange}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {filteredMenu.length === 0 ? (
            <EmptyState
              className="col-span-2"
              icon={UtensilsCrossed}
              title="No items in this category"
              description="Select a different category to browse available food."
            />
          ) : (
            filteredMenu.map((item) => (
              <DesktopMenuCard
                key={item.id}
                item={item}
                onAdd={() => onAddToCart(item)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
