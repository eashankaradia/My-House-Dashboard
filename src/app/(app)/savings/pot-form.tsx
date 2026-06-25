"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
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
import { POT_COLORS } from "@/lib/constants";
import { savingsPotSchema, type SavingsPotInput } from "@/lib/schemas";
import type { SavingsPot } from "@/lib/database.types";
import { FormDeleteButton } from "@/components/shared/form-delete-button";
import { createPot, deletePot, updatePot } from "./actions";

export function PotForm({ pot, trigger }: { pot?: SavingsPot; trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(pot);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SavingsPotInput>({
    resolver: zodResolver(savingsPotSchema),
    defaultValues: {
      name: pot?.name ?? "",
      target_amount: pot?.target_amount ?? 0,
      current_amount: pot?.current_amount ?? 0,
      monthly_contribution: pot?.monthly_contribution ?? 0,
      target_date: pot?.target_date ?? "",
      color: pot?.color ?? "emerald",
      notes: pot?.notes ?? "",
    },
  });

  function onSubmit(values: SavingsPotInput) {
    startTransition(async () => {
      const result = editing ? await updatePot(pot!.id, values) : await createPot(values);
      if (result?.error) {
        toast({ variant: "destructive", title: "Something went wrong", description: result.error });
        return;
      }
      toast({ title: editing ? "Pot updated" : "Pot created" });
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
            {editing ? "Edit" : "New pot"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit pot" : "Create a savings pot"}</DialogTitle>
          <DialogDescription>Set a target and a monthly contribution to forecast progress.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" placeholder="e.g. Emergency Fund" {...register("name")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Current (£)" htmlFor="current_amount" error={errors.current_amount?.message}>
              <Input id="current_amount" type="number" step="0.01" {...register("current_amount")} />
            </Field>
            <Field label="Target (£)" htmlFor="target_amount" error={errors.target_amount?.message}>
              <Input id="target_amount" type="number" step="0.01" {...register("target_amount")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monthly (£)" htmlFor="monthly_contribution" error={errors.monthly_contribution?.message}>
              <Input id="monthly_contribution" type="number" step="0.01" {...register("monthly_contribution")} />
            </Field>
            <Field label="Target date" htmlFor="target_date">
              <Input id="target_date" type="date" {...register("target_date")} />
            </Field>
          </div>
          <Field label="Colour">
            <NativeSelect {...register("color")} className="capitalize">
              {POT_COLORS.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" rows={2} {...register("notes")} />
          </Field>
          <DialogFooter className="sm:justify-between">
            {editing && pot ? (
              <FormDeleteButton
                label="Delete pot"
                onDelete={async () => {
                  const res = await deletePot(pot.id);
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
                {pending ? "Saving…" : editing ? "Save changes" : "Create pot"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
