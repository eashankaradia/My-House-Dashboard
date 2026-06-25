"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form-field";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import type { SavingsPot } from "@/lib/database.types";
import { addContribution } from "./actions";

const todayISO = () => new Date().toISOString().slice(0, 10);

/** A pot card's "Add" control: log a manual contribution, or add the monthly. */
export function QuickContribute({ pot }: { pot: SavingsPot }) {
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const monthly = Number(pot.monthly_contribution);

  function add(value: number, note: string) {
    if (!value || value <= 0) return;
    startTransition(async () => {
      const res = await addContribution(pot.id, {
        amount: value,
        direction: "deposit",
        occurred_on: todayISO(),
        note,
      });
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't add", description: res.error });
        return;
      }
      toast({ title: "Contribution added" });
      setAmount("");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to {pot.name}</DialogTitle>
          <DialogDescription>Log a contribution. It’s recorded with today’s date.</DialogDescription>
        </DialogHeader>

        {monthly > 0 ? (
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-between"
            disabled={pending}
            onClick={() => add(monthly, "Monthly contribution")}
          >
            <span>Add this month’s contribution</span>
            <span className="font-semibold">{formatCurrency(monthly)}</span>
          </Button>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            add(Number(amount), "Manual contribution");
          }}
          className="space-y-3"
        >
          <Field label="Or a custom amount (£)" htmlFor="qc-amount">
            <Input
              id="qc-amount"
              type="number"
              step="0.01"
              min="0"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </Field>
          <Button type="submit" className="w-full" disabled={pending || !amount}>
            {pending ? "Adding…" : "Add contribution"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
