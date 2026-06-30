"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import type { IncomeMonth } from "@/lib/database.types";
import { upsertIncomeMonth, deleteIncomeMonth } from "./actions";

type Props = {
  month: string;
  entry?: IncomeMonth;
  defaultNet?: number;
  trigger: React.ReactNode;
};

export function IncomeMonthForm({ month, entry, defaultNet, trigger }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(entry);

  const [net, setNet] = React.useState(entry?.net_income != null ? String(entry.net_income) : defaultNet != null ? String(defaultNet) : "");
  const [bonus, setBonus] = React.useState(entry?.bonus != null ? String(entry.bonus) : "");
  const [notes, setNotes] = React.useState(entry?.notes ?? "");

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v && entry) {
      setNet(String(entry.net_income));
      setBonus(String(entry.bonus));
      setNotes(entry.notes ?? "");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!net) return;
    startTransition(async () => {
      const result = await upsertIncomeMonth({
        month,
        net_income: Number(net),
        bonus: bonus ? Number(bonus) : 0,
        notes: notes.trim() || undefined,
      });
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: "Income saved" });
      setOpen(false);
    });
  }

  const monthLabel = new Date(month + "T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{monthLabel}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Net income (£)" required>
              <Input type="number" step="0.01" min="0" value={net} onChange={(e) => setNet(e.target.value)} required autoFocus />
            </Field>
            <Field label="Bonus (£)">
              <Input type="number" step="0.01" min="0" value={bonus} onChange={(e) => setBonus(e.target.value)} placeholder="0" />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </Field>
          <DialogFooter className={editing ? "sm:justify-between" : undefined}>
            {editing && entry && (
              <FormDeleteButton
                label="Delete entry"
                onDelete={async () => {
                  const r = await deleteIncomeMonth(entry.id);
                  if (!r?.error) {
                    toast({ title: "Entry deleted" });
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
                Save
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
