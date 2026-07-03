"use client";

import * as React from "react";
import { Plus, Pencil } from "lucide-react";
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
import { useEditDialogOpen } from "@/hooks/use-open-from-url";
import type { CreditCard } from "@/lib/database.types";
import { createCreditCard, updateCreditCard, deleteCreditCard } from "./actions";

type Props = { card?: CreditCard; trigger?: React.ReactNode };

export function CreditCardForm({ card, trigger }: Props) {
  const { open, onOpenChange: setOpen } = useEditDialogOpen(card?.id, "card");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(card);

  const [name, setName] = React.useState(card?.name ?? "");
  const [last4, setLast4] = React.useState(card?.last4 ?? "");
  const [statementDay, setStatementDay] = React.useState(card?.statement_day != null ? String(card.statement_day) : "");
  const [notes, setNotes] = React.useState(card?.notes ?? "");

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v && card) {
      setName(card.name);
      setLast4(card.last4 ?? "");
      setStatementDay(card.statement_day != null ? String(card.statement_day) : "");
      setNotes(card.notes ?? "");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const payload = {
        name: name.trim(),
        last4: last4.trim() || undefined,
        statement_day: statementDay ? Number(statementDay) : undefined,
        notes: notes.trim() || undefined,
      };
      const result = editing ? await updateCreditCard(card!.id, payload) : await createCreditCard(payload);
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: editing ? "Card updated" : "Card added" });
      setOpen(false);
      if (!editing) {
        setName("");
        setLast4("");
        setStatementDay("");
        setNotes("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5">
            {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Edit" : "Add card"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit credit card" : "Add a credit card"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Name" required>
            <Input placeholder="e.g. Amex Gold" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Last 4 digits">
              <Input maxLength={4} placeholder="1234" value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label="Statement day" hint="Day of month it closes">
              <Input type="number" min="1" max="31" placeholder="e.g. 21" value={statementDay} onChange={(e) => setStatementDay(e.target.value)} />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </Field>
          <DialogFooter className={editing ? "sm:justify-between" : undefined}>
            {editing && (
              <FormDeleteButton
                label="Delete card"
                onDelete={async () => {
                  const r = await deleteCreditCard(card!.id);
                  if (!r?.error) {
                    toast({ title: "Card deleted" });
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
                {editing ? "Save changes" : "Add card"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
