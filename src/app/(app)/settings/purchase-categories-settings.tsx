"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { PurchaseCategoryRow } from "@/lib/database.types";
import { addPurchaseCategory, removePurchaseCategory } from "./actions";

export function PurchaseCategoriesSettings({ categories }: { categories: PurchaseCategoryRow[] }) {
  const [name, setName] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await addPurchaseCategory(name);
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't add category", description: res.error });
        return;
      }
      setName("");
      toast({ title: "Category added" });
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await removePurchaseCategory(id);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't remove category", description: res.error });
    });
  }

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lighting" className="h-9" />
        <Button type="submit" size="sm" className="h-9 gap-1.5" disabled={pending}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <span key={category.id} className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-sm">
            {category.name}
            <button
              type="button"
              onClick={() => remove(category.id)}
              aria-label={`Remove ${category.name}`}
              className="rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-destructive"
              disabled={pending}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
