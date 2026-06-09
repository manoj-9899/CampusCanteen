"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { MenuItemForm, type MenuItemFormValues } from "./MenuItemForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip, stockChipVariant } from "@/components/ui/StatusChip";
import { cn } from "@/lib/cn";
import type { MenuItem } from "@/types";

type PanelMode = "list" | "create" | "edit";

export function StaffMenuPanel({
  items,
  busy,
  onCreate,
  onUpdate,
  onDelete,
}: {
  items: MenuItem[];
  busy: boolean;
  onCreate: (values: MenuItemFormValues) => Promise<void>;
  onUpdate: (id: string, values: MenuItemFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<PanelMode>("list");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [error, setError] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort(),
    [items]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const openCreate = () => {
    setError("");
    setEditingItem(null);
    setMode("create");
  };

  const openEdit = (item: MenuItem) => {
    setError("");
    setEditingItem(item);
    setMode("edit");
  };

  const closeForm = () => {
    setMode("list");
    setEditingItem(null);
    setError("");
  };

  const handleCreate = async (values: MenuItemFormValues) => {
    setError("");
    try {
      await onCreate(values);
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create item.");
    }
  };

  const handleUpdate = async (values: MenuItemFormValues) => {
    if (!editingItem) return;
    setError("");
    try {
      await onUpdate(editingItem.id, values);
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    }
  };

  const handleDelete = async (item: MenuItem) => {
    const confirmed = window.confirm(
      `Delete "${item.name}"? This cannot be undone if the item has no order history.`
    );
    if (!confirmed) return;
    setError("");
    try {
      await onDelete(item.id);
      if (editingItem?.id === item.id) closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete item.");
    }
  };

  if (mode === "create" || mode === "edit") {
    return (
      <MenuItemForm
        mode={mode}
        item={editingItem ?? undefined}
        existingCategories={categories}
        busy={busy}
        error={error}
        onSubmit={(values) =>
          void (mode === "create" ? handleCreate(values) : handleUpdate(values))
        }
        onCancel={closeForm}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" aria-hidden />
              Menu catalog
            </CardTitle>
            <CardDescription>
              Add, edit, or remove items students see when ordering.
            </CardDescription>
          </div>
          <Button onClick={openCreate} disabled={busy}>
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </CardContent>
      </Card>

      {error && <Alert variant="error">{error}</Alert>}

      {items.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No menu items"
          description="Add your first item so students can start ordering."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          }
        />
      ) : (
        grouped.map(([category, categoryItems]) => (
          <Card key={category}>
            <CardContent className="p-4 sm:p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                {category}
              </h3>
              <ul className="mt-3 space-y-2">
                {categoryItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        <span aria-hidden className="mr-1.5">
                          {item.imageEmoji}
                        </span>
                        {item.name}
                        <span className="ml-2 font-normal text-primary">
                          ₹{item.price}
                        </span>
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                        {item.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <StatusChip
                          label={item.isAvailable ? "Online" : "Sold out"}
                          variant={item.isAvailable ? "success" : "out"}
                        />
                        <StatusChip
                          label={item.availabilityLabel}
                          variant={stockChipVariant(item.stockStatus)}
                        />
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(item)}
                        disabled={busy}
                        aria-label={`Edit ${item.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDelete(item)}
                        disabled={busy}
                        className={cn("text-danger hover:bg-red-50 hover:text-danger")}
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
