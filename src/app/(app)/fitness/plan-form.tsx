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
import type { WorkoutPlan } from "@/lib/database.types";
import { createWorkoutPlan, updateWorkoutPlan, deleteWorkoutPlan } from "./actions";
import { useRouter } from "next/navigation";

type Props = { plan?: WorkoutPlan; trigger?: React.ReactNode };

export function PlanForm({ plan, trigger }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const editing = Boolean(plan);

  const [name, setName] = React.useState(plan?.name ?? "");
  const [description, setDescription] = React.useState(plan?.description ?? "");

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v && plan) {
      setName(plan.name);
      setDescription(plan.description ?? "");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const payload = { name: name.trim(), description: description.trim() || undefined };
      const result = editing ? await updateWorkoutPlan(plan!.id, payload) : await createWorkoutPlan(payload);
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: editing ? "Plan updated" : "Plan created" });
      setOpen(false);
      if (!editing) {
        setName("");
        setDescription("");
      }
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5">
            {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Edit plan" : "New plan"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit workout plan" : "New workout plan"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Name" required>
            <Input placeholder="e.g. Push day, Leg day, 5x5" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </Field>
          <Field label="Description">
            <Textarea placeholder="What this plan is for..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </Field>
          <DialogFooter className={editing ? "sm:justify-between" : undefined}>
            {editing && (
              <FormDeleteButton
                label="Delete plan"
                onDelete={async () => {
                  const r = await deleteWorkoutPlan(plan!.id);
                  if (!r?.error) {
                    toast({ title: "Plan deleted" });
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
                {editing ? "Save changes" : "Create plan"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
