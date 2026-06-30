"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form-field";
import { useToast } from "@/hooks/use-toast";
import type { CreditCardStatement } from "@/lib/database.types";
import { upsertCreditCardStatement, deleteCreditCardStatement } from "./actions";

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

type Props = { cardId: string; statement?: CreditCardStatement; trigger?: React.ReactNode };

export function CreditCardStatementForm({ cardId, statement, trigger }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(statement);

  const [month, setMonth] = React.useState(statement?.statement_month ?? currentMonth());
  const [amount, setAmount] = React.useState(statement?.amount != null ? String(statement.amount) : "");
  const [isPaid, setIsPaid] = React.useState(statement?.is_paid ?? false);

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v && statement) {
      setMonth(statement.statement_month);
      setAmount(String(statement.amount));
      setIsPaid(statement.is_paid);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    startTransition(async () => {
      const result = await upsertCreditCardStatement(cardId, {
        statement_month: month,
        amount: Number(amount),
        is_paid: isPaid,
      });
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: "Statement saved" });
      setOpen(false);
      if (!editing) {
        setMonth(currentMonth());
        setAmount("");
        setIsPaid(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5">
            <Plus className="h-4 w-4" /> Log statement
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit statement" : "Log a statement"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Month">
            <Input type="month" value={month.slice(0, 7)} onChange={(e) => setMonth(`${e.target.value}-01`)} required />
          </Field>
          <Field label="Statement amount (£)" required>
            <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={isPaid} onCheckedChange={(v) => setIsPaid(Boolean(v))} />
            Paid
          </label>
          <DialogFooter className={editing ? "sm:justify-between" : undefined}>
            {editing && statement && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  startTransition(async () => {
                    const r = await deleteCreditCardStatement(statement.id);
                    if (!r?.error) {
                      toast({ title: "Statement deleted" });
                      setOpen(false);
                    }
                  });
                }}
              >
                Delete
              </Button>
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
