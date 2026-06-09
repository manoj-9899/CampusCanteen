"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { MENU_CATEGORIES } from "@/lib/menu-schema";
import type { MenuItem } from "@/types";

export interface MenuItemFormValues {
  name: string;
  description: string;
  price: string;
  category: string;
  imageEmoji: string;
  isAvailable: boolean;
  stockQuantity: string;
}

const emptyForm = (): MenuItemFormValues => ({
  name: "",
  description: "",
  price: "",
  category: MENU_CATEGORIES[0],
  imageEmoji: "🍽️",
  isAvailable: true,
  stockQuantity: "0",
});

function fromItem(item: MenuItem): MenuItemFormValues {
  return {
    name: item.name,
    description: item.description,
    price: String(item.price),
    category: item.category,
    imageEmoji: item.imageEmoji,
    isAvailable: item.isAvailable,
    stockQuantity: String(item.stockQuantity),
  };
}

export function MenuItemForm({
  mode,
  item,
  existingCategories,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  item?: MenuItem;
  existingCategories: string[];
  busy: boolean;
  error?: string;
  onSubmit: (values: MenuItemFormValues) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<MenuItemFormValues>(
    item ? fromItem(item) : emptyForm()
  );

  useEffect(() => {
    setForm(item ? fromItem(item) : emptyForm());
  }, [item, mode]);

  const categories = useMemo(() => {
    const merged = new Set([...MENU_CATEGORIES, ...existingCategories]);
    if (form.category) merged.add(form.category);
    return Array.from(merged).sort();
  }, [existingCategories, form.category]);

  const update =
    (field: keyof MenuItemFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value =
        e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 sm:p-5">
        <CardTitle>{mode === "create" ? "Add menu item" : "Edit menu item"}</CardTitle>
        <CardDescription>
          {mode === "create"
            ? "New items appear on the student menu immediately."
            : "Changes apply to the live student menu."}
        </CardDescription>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Name"
              name="name"
              value={form.name}
              onChange={update("name")}
              required
              disabled={busy}
            />
            <Field
              label="Emoji"
              name="imageEmoji"
              value={form.imageEmoji}
              onChange={update("imageEmoji")}
              hint="Single emoji shown on the menu"
              required
              disabled={busy}
              className="sm:max-w-[8rem]"
            />
          </div>

          <div>
            <label
              htmlFor="menu-description"
              className="block text-sm font-medium text-foreground"
            >
              Description <span className="text-danger">*</span>
            </label>
            <textarea
              id="menu-description"
              name="description"
              value={form.description}
              onChange={update("description")}
              required
              disabled={busy}
              rows={3}
              className={cn(
                "mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Price (₹)"
              name="price"
              type="number"
              min={1}
              step={1}
              value={form.price}
              onChange={update("price")}
              required
              disabled={busy}
            />
            <div className="space-y-1.5">
              <label
                htmlFor="menu-category"
                className="block text-sm font-medium text-foreground"
              >
                Category <span className="text-danger">*</span>
              </label>
              <select
                id="menu-category"
                name="category"
                value={form.category}
                onChange={update("category")}
                disabled={busy}
                className={cn(
                  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            {mode === "create" && (
              <Field
                label="Initial stock"
                name="stockQuantity"
                type="number"
                min={0}
                value={form.stockQuantity}
                onChange={update("stockQuantity")}
                hint="Set stock in Inventory tab later"
                disabled={busy}
              />
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface-muted px-3 py-3">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={update("isAvailable")}
              disabled={busy}
              className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-sm font-medium text-foreground">
              Available for online orders
            </span>
          </label>

          {error && <Alert variant="error">{error}</Alert>}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={busy}>
              {mode === "create" ? "Create item" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
