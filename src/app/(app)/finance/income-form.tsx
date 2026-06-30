"use client";

import * as React from "react";
import { Pencil, Wallet } from "lucide-react";
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
import { upsertFinanceSettings } from "./actions";
import type { FinanceSettings } from "@/lib/database.types";

export function IncomeForm({ settings }: { settings: FinanceSettings | null }) {
  const [open, setOpen] = React.useState(false);
  const [income, setIncome] = React.useState("");
  const [label, setLabel] = React.useState("Monthly income");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      setIncome(settings?.monthly_income != null ? String(settings.monthly_income) : "");
      setLabel(settings?.income_label ?? "Monthly income");
      setError(null);
    }
  }

  function handleSave() {
    const parsed = income.trim() ? parseFloat(income) : null;
    if (income.trim() && (isNaN(parsed!) || parsed! < 0)) {
      setError("Enter a valid amount.");
      return;
    }
    startTransition(async () => {
      const res = await upsertFinanceSettings({
        monthlyIncome: parsed,
        incomeLabel: label.trim() || "Monthly income",
      });
      if (res?.error) { setError(res.error); return; }
      setOpen(false);
    });
  }

  const trigger = settings?.monthly_income != null ? (
    <Button variant="outline" size="sm" className="gap-1.5">
      <Pencil className="h-3.5 w-3.5" />
      Edit income
    </Button>
  ) : (
    <Button size="sm" className="gap-1.5">
      <Wallet className="h-3.5 w-3.5" />
      Set income
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Monthly income</DialogTitle>
          <DialogDescription>
            Your take-home pay. Used to calculate net monthly position and savings rate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="income-label">Label</Label>
            <Input
              id="income-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Monthly income"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="income-amount">Amount (£/month)</Label>
            <Input
              id="income-amount"
              type="number"
              min="0"
              step="1"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="e.g. 3500"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
