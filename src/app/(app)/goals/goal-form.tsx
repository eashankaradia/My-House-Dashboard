"use client";

import * as React from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
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
import { GOAL_CATEGORIES, GOAL_STATUSES } from "@/lib/constants";
import type { Goal } from "@/lib/database.types";
import { createGoal, updateGoal, deleteGoal } from "./actions";

type Props = { goal?: Goal; trigger?: React.ReactNode };

export function GoalForm({ goal, trigger }: Props) {
  const { open, onOpenChange: setOpen } = useEditDialogOpen(goal?.id, "goal");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(goal);

  const [title, setTitle] = React.useState(goal?.title ?? "");
  const [description, setDescription] = React.useState(goal?.description ?? "");
  const [category, setCategory] = React.useState<string>(goal?.category ?? "Personal");
  const [targetValue, setTargetValue] = React.useState(goal?.target_value != null ? String(goal.target_value) : "");
  const [currentValue, setCurrentValue] = React.useState(goal?.current_value != null ? String(goal.current_value) : "0");
  const [unit, setUnit] = React.useState(goal?.unit ?? "");
  const [targetDate, setTargetDate] = React.useState(goal?.target_date ?? "");
  const [status, setStatus] = React.useState(goal?.status ?? "Active");

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v && goal) {
      setTitle(goal.title);
      setDescription(goal.description ?? "");
      setCategory(goal.category);
      setTargetValue(goal.target_value != null ? String(goal.target_value) : "");
      setCurrentValue(goal.current_value != null ? String(goal.current_value) : "0");
      setUnit(goal.unit ?? "");
      setTargetDate(goal.target_date ?? "");
      setStatus(goal.status ?? "Active");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      const input = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        target_value: targetValue ? Number(targetValue) : undefined,
        current_value: currentValue ? Number(currentValue) : undefined,
        unit: unit.trim() || undefined,
        target_date: targetDate || undefined,
      };
      const result = editing
        ? await updateGoal(goal!.id, { ...input, status })
        : await createGoal(input);
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: editing ? "Goal updated" : "Goal added" });
      setOpen(false);
      if (!editing) {
        setTitle(""); setDescription(""); setCategory("Personal");
        setTargetValue(""); setCurrentValue("0"); setUnit(""); setTargetDate("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5">
            {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Edit" : "Add goal"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit goal" : "New goal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Title" required>
            <Input
              placeholder="e.g. Run a 5k"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </Field>
          <Field label="Description">
            <Textarea
              placeholder="What does success look like?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <NativeSelect value={category} onChange={(e) => setCategory(e.target.value)}>
                {GOAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </NativeSelect>
            </Field>
            {editing && (
              <Field label="Status">
                <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)}>
                  {GOAL_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </NativeSelect>
              </Field>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Target">
              <Input
                type="number"
                placeholder="100"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </Field>
            <Field label="Current">
              <Input
                type="number"
                placeholder="0"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
              />
            </Field>
            <Field label="Unit">
              <Input
                placeholder="kg, km, £..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Target date">
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </Field>
          <DialogFooter className={editing ? "sm:justify-between" : undefined}>
            {editing && (
              <FormDeleteButton
                label="Delete goal"
                onDelete={async () => {
                  const r = await deleteGoal(goal!.id);
                  if (!r?.error) { toast({ title: "Goal deleted" }); setOpen(false); }
                  return r;
                }}
              />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {editing ? "Save changes" : "Add goal"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
