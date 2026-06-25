"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
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
import { BILL_CATEGORIES, FREQUENCIES, FREQUENCY_LABELS } from "@/lib/constants";
import { billSchema, type BillInput } from "@/lib/schemas";
import type { Bill } from "@/lib/database.types";
import { FormDeleteButton } from "@/components/shared/form-delete-button";
import { createBill, deleteBill, updateBill } from "./actions";

type Props = { bill?: Bill; trigger?: React.ReactNode };

export function BillForm({ bill, trigger }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(bill);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BillInput>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      name: bill?.name ?? "",
      category: bill?.category ?? "Utilities",
      amount: bill?.amount ?? 0,
      frequency: bill?.frequency ?? "monthly",
      due_date: bill?.due_date ?? "",
      payment_account: bill?.payment_account ?? "",
      is_fixed: bill?.is_fixed ?? true,
      notes: bill?.notes ?? "",
    },
  });

  function onSubmit(values: BillInput) {
    startTransition(async () => {
      const result = editing ? await updateBill(bill!.id, values) : await createBill(values);
      if (result?.error) {
        toast({ variant: "destructive", title: "Something went wrong", description: result.error });
        return;
      }
      toast({ title: editing ? "Bill updated" : "Bill added" });
      setOpen(false);
      if (!editing) reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Edit" : "Add bill"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit bill" : "Add a bill"}</DialogTitle>
          <DialogDescription>Recurring household costs you want to keep on top of.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" placeholder="e.g. British Gas" {...register("name")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" error={errors.category?.message}>
              <NativeSelect {...register("category")}>
                {BILL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Amount (£)" htmlFor="amount" required error={errors.amount?.message}>
              <Input id="amount" type="number" step="0.01" {...register("amount")} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Frequency" error={errors.frequency?.message}>
              <NativeSelect {...register("frequency")}>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {FREQUENCY_LABELS[f]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Next due date" htmlFor="due_date" error={errors.due_date?.message}>
              <Input id="due_date" type="date" {...register("due_date")} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Payment account" htmlFor="payment_account">
              <Input id="payment_account" placeholder="e.g. Joint account" {...register("payment_account")} />
            </Field>
            <Field label="Type">
              <NativeSelect {...register("is_fixed")}>
                <option value="true">Fixed</option>
                <option value="false">Variable</option>
              </NativeSelect>
            </Field>
          </div>

          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" rows={2} {...register("notes")} />
          </Field>

          <DialogFooter className="sm:justify-between">
            {editing && bill ? (
              <FormDeleteButton
                label="Delete bill"
                onDelete={async () => {
                  const res = await deleteBill(bill.id);
                  if (!res?.error) setOpen(false);
                  return res;
                }}
              />
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : editing ? "Save changes" : "Add bill"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
