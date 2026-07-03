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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { SavingsPot } from "@/lib/database.types";
import { addContribution, adjustPotValueOnly } from "./actions";

const todayISO = () => new Date().toISOString().slice(0, 10);

/** A pot card's "Add" control: log a contribution, or just update its value. */
export function QuickContribute({ pot, trigger }: { pot: SavingsPot; trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"contribution" | "value">("contribution");
  const [amount, setAmount] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;
    startTransition(async () => {
      const res =
        mode === "contribution"
          ? await addContribution(pot.id, { amount: value, direction: "deposit", occurred_on: todayISO() })
          : await adjustPotValueOnly(pot.id, value);
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't add", description: res.error });
        return;
      }
      toast({ title: mode === "contribution" ? "Contribution added" : "Value updated" });
      setAmount("");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Plus className="h-4 w-4" /> Add
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to {pot.name}</DialogTitle>
          <DialogDescription>Log money you put in, or just update what it&apos;s worth now.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setMode("contribution")}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm font-medium",
                mode === "contribution" ? "border-primary bg-primary/10" : "text-muted-foreground",
              )}
            >
              Contribution
            </button>
            <button
              type="button"
              onClick={() => setMode("value")}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm font-medium",
                mode === "value" ? "border-primary bg-primary/10" : "text-muted-foreground",
              )}
            >
              Value only
            </button>
          </div>
          <Field label="Amount (£)" hint={mode === "value" ? "Added to the current value, not counted as a contribution" : undefined}>
            <Input
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
            {pending ? "Adding…" : mode === "contribution" ? "Add contribution" : "Update value"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
