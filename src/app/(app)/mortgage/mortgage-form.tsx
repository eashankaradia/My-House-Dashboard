"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form-field";
import { useToast } from "@/hooks/use-toast";
import { mortgageSchema, type MortgageInput } from "@/lib/schemas";
import type { Mortgage } from "@/lib/database.types";
import { saveMortgage } from "./actions";

export function MortgageForm({ mortgage }: { mortgage?: Mortgage }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(mortgage);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MortgageInput>({
    resolver: zodResolver(mortgageSchema),
    defaultValues: {
      property_name: mortgage?.property_name ?? "My Home",
      property_value: mortgage?.property_value ?? 0,
      mortgage_balance: mortgage?.mortgage_balance ?? 0,
      interest_rate: mortgage?.interest_rate ?? 0,
      monthly_payment: mortgage?.monthly_payment ?? 0,
      term_months: mortgage?.term_months ?? undefined,
      start_date: mortgage?.start_date ?? "",
      fixed_term_end_date: mortgage?.fixed_term_end_date ?? "",
      provider: mortgage?.provider ?? "",
      notes: mortgage?.notes ?? "",
    },
  });

  function onSubmit(values: MortgageInput) {
    startTransition(async () => {
      const result = await saveMortgage(mortgage?.id ?? null, values);
      if (result?.error) {
        toast({ variant: "destructive", title: "Something went wrong", description: result.error });
        return;
      }
      toast({ title: editing ? "Mortgage updated" : "Mortgage saved" });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={editing ? "outline" : "default"}>
          {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {editing ? "Edit details" : "Add mortgage"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit mortgage" : "Add your mortgage"}</DialogTitle>
          <DialogDescription>Used to calculate equity, LTV and payoff projections.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Property name" htmlFor="property_name" error={errors.property_name?.message}>
            <Input id="property_name" {...register("property_name")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Property value (£)" htmlFor="property_value" error={errors.property_value?.message}>
              <Input id="property_value" type="number" step="0.01" {...register("property_value")} />
            </Field>
            <Field label="Balance (£)" htmlFor="mortgage_balance" error={errors.mortgage_balance?.message}>
              <Input id="mortgage_balance" type="number" step="0.01" {...register("mortgage_balance")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Interest rate (%)" htmlFor="interest_rate" error={errors.interest_rate?.message}>
              <Input id="interest_rate" type="number" step="0.001" {...register("interest_rate")} />
            </Field>
            <Field label="Monthly payment (£)" htmlFor="monthly_payment" error={errors.monthly_payment?.message}>
              <Input id="monthly_payment" type="number" step="0.01" {...register("monthly_payment")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Remaining term (months)" htmlFor="term_months" hint="Optional">
              <Input id="term_months" type="number" {...register("term_months")} />
            </Field>
            <Field label="Provider" htmlFor="provider">
              <Input id="provider" placeholder="e.g. Nationwide" {...register("provider")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date" htmlFor="start_date">
              <Input id="start_date" type="date" {...register("start_date")} />
            </Field>
            <Field label="Fixed term ends" htmlFor="fixed_term_end_date">
              <Input id="fixed_term_end_date" type="date" {...register("fixed_term_end_date")} />
            </Field>
          </div>
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" rows={2} {...register("notes")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
