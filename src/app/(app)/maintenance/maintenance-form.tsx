"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
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
import { MAINTENANCE_FREQUENCIES, FREQUENCY_LABELS } from "@/lib/constants";
import { maintenanceSchema, type MaintenanceInput } from "@/lib/schemas";
import type { MaintenanceTask } from "@/lib/database.types";
import { FormDeleteButton } from "@/components/shared/form-delete-button";
import { createMaintenance, deleteMaintenance, updateMaintenance } from "./actions";

export function MaintenanceForm({ task, trigger }: { task?: MaintenanceTask; trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(task);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaintenanceInput>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      task: task?.task ?? "",
      frequency: task?.frequency ?? "annually",
      last_completed_date: task?.last_completed_date ?? "",
      next_due_date: task?.next_due_date ?? "",
      cost: task?.cost ?? 0,
      notes: task?.notes ?? "",
    },
  });

  function onSubmit(values: MaintenanceInput) {
    startTransition(async () => {
      const result = editing ? await updateMaintenance(task!.id, values) : await createMaintenance(values);
      if (result?.error) {
        toast({ variant: "destructive", title: "Something went wrong", description: result.error });
        return;
      }
      toast({ title: editing ? "Task updated" : "Task added" });
      setOpen(false);
      if (!editing) reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" /> Add task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit task" : "Add maintenance task"}</DialogTitle>
          <DialogDescription>We&apos;ll work out the next due date from the frequency.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Task" htmlFor="task" required error={errors.task?.message}>
            <Input id="task" placeholder="e.g. Boiler service" {...register("task")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Frequency">
              <NativeSelect {...register("frequency")}>
                {MAINTENANCE_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Typical cost (£)" htmlFor="cost" error={errors.cost?.message}>
              <Input id="cost" type="number" step="0.01" {...register("cost")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Last completed" htmlFor="last_completed_date">
              <Input id="last_completed_date" type="date" {...register("last_completed_date")} />
            </Field>
            <Field label="Next due" htmlFor="next_due_date" hint="Leave blank to auto-calc">
              <Input id="next_due_date" type="date" {...register("next_due_date")} />
            </Field>
          </div>
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" rows={2} {...register("notes")} />
          </Field>
          <DialogFooter className="sm:justify-between">
            {editing && task ? (
              <FormDeleteButton
                label="Delete task"
                onDelete={async () => {
                  const res = await deleteMaintenance(task.id);
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
                {pending ? "Saving…" : editing ? "Save changes" : "Add task"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
