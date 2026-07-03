"use client";

import * as React from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form-field";
import { FormDeleteButton } from "@/components/shared/form-delete-button";
import { useToast } from "@/hooks/use-toast";
import { useEditDialogOpen } from "@/hooks/use-open-from-url";
import { cn } from "@/lib/utils";
import { RAG_STATUSES, RAG_LABELS } from "@/lib/constants";
import type { Essential } from "@/lib/database.types";
import { createEssential, updateEssential, deleteEssential } from "./actions";

const RAG_DOT: Record<string, string> = {
  red: "bg-rose-500",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
};

type Props = { categories: string[]; defaultCategory?: string; essential?: Essential; trigger?: React.ReactNode };

export function EssentialForm({ categories, defaultCategory, essential, trigger }: Props) {
  const { open, onOpenChange: setOpen } = useEditDialogOpen(essential?.id, "essential");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(essential);

  const [category, setCategory] = React.useState(essential?.category ?? defaultCategory ?? "");
  const [name, setName] = React.useState(essential?.name ?? "");
  const [rag, setRag] = React.useState(essential?.rag ?? "red");
  const [haveNotes, setHaveNotes] = React.useState(essential?.have_notes ?? "");

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v && essential) {
      setCategory(essential.category);
      setName(essential.name);
      setRag(essential.rag);
      setHaveNotes(essential.have_notes ?? "");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category.trim() || !name.trim()) return;
    startTransition(async () => {
      const payload = { category: category.trim(), name: name.trim(), rag, have_notes: haveNotes.trim() || undefined };
      const result = editing ? await updateEssential(essential!.id, payload) : await createEssential(payload);
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: editing ? "Updated" : "Added" });
      setOpen(false);
      if (!editing) {
        setName("");
        setRag("red");
        setHaveNotes("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5">
            {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Edit" : "Add item"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit item" : "New essential"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Category" required hint="Type a new one, or pick an existing category">
            <Input list="essential-categories" value={category} onChange={(e) => setCategory(e.target.value)} required />
            <datalist id="essential-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Item" required>
            <Input placeholder="e.g. Running trainers" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </Field>
          <Field label="Status">
            <div className="flex gap-1.5">
              {RAG_STATUSES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRag(r)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium",
                    rag === r ? "border-primary bg-primary/10" : "text-muted-foreground",
                  )}
                >
                  <span className={cn("h-2.5 w-2.5 rounded-full", RAG_DOT[r])} />
                  {RAG_LABELS[r]}
                </button>
              ))}
            </div>
          </Field>
          <Field label="What you have" hint="Optional — e.g. the specific product or brand">
            <Input value={haveNotes} onChange={(e) => setHaveNotes(e.target.value)} placeholder="e.g. Harry's Razor" />
          </Field>
          <DialogFooter className={editing ? "sm:justify-between" : undefined}>
            {editing && (
              <FormDeleteButton
                label="Delete item"
                onDelete={async () => {
                  const r = await deleteEssential(essential!.id);
                  if (!r?.error) {
                    toast({ title: "Item deleted" });
                    setOpen(false);
                  }
                  return r;
                }}
              />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {editing ? "Save changes" : "Add item"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
