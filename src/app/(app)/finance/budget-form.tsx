"use client";

import * as React from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertBudget, deleteBudget } from "./actions";
import { BUDGET_CATEGORIES } from "@/lib/constants";
import type { Budget } from "@/lib/database.types";

interface BudgetFormProps {
  budget?: Budget;
  trigger?: React.ReactNode;
  /** Pre-select a category (e.g. when adding from a category row). */
  defaultCategory?: string;
}

export function BudgetForm({ budget, trigger, defaultCategory }: BudgetFormProps) {
  const editing = !!budget;
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState(defaultCategory ?? "");
  const [limit, setLimit] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      setCategory(budget?.category ?? defaultCategory ?? "");
      setLimit(budget?.monthly_limit != null ? String(budget.monthly_limit) : "");
      setError(null);
    }
  }

  function handleSave() {
    if (!category) { setError("Select a category."); return; }
    const parsed = parseFloat(limit);
    if (isNaN(parsed) || parsed < 0) { setError("Enter a valid amount."); return; }
    startTransition(async () => {
      const res = await upsertBudget({ category, monthlyLimit: parsed });
      if (res?.error) { setError(res.error); return; }
      setOpen(false);
    });
  }

  function handleDelete() {
    if (!budget) return;
    startTransition(async () => {
      await deleteBudget(budget.id);
      setOpen(false);
    });
  }

  const defaultTrigger = editing ? (
    <button type="button" className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
      <Pencil className="h-3.5 w-3.5" />
    </button>
  ) : (
    <Button size="sm" variant="outline" className="gap-1.5">
      <Plus className="h-3.5 w-3.5" />
      Add budget
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit budget" : "Add budget"}</DialogTitle>
          <DialogDescription>
            Set a monthly spending limit for a category.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory} disabled={editing}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="budget-limit">Monthly limit (£)</Label>
            <Input
              id="budget-limit"
              type="number"
              min="0"
              step="1"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="e.g. 200"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="sm:justify-between">
          {editing && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
