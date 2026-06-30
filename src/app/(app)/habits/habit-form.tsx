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
import { HABIT_FREQUENCIES, HABIT_COLORS } from "@/lib/constants";
import type { Habit } from "@/lib/database.types";
import { createHabit, updateHabit, deleteHabit } from "./actions";

type Props = { habit?: Habit; trigger?: React.ReactNode };

export function HabitForm({ habit, trigger }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(habit);

  const [name, setName] = React.useState(habit?.name ?? "");
  const [description, setDescription] = React.useState(habit?.description ?? "");
  const [frequency, setFrequency] = React.useState(habit?.frequency ?? "daily");
  const [color, setColor] = React.useState(habit?.color ?? "emerald");

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v && habit) {
      setName(habit.name);
      setDescription(habit.description ?? "");
      setFrequency(habit.frequency);
      setColor(habit.color ?? "emerald");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const result = editing
        ? await updateHabit(habit!.id, { name: name.trim(), description: description.trim() || undefined, frequency, color })
        : await createHabit({ name: name.trim(), description: description.trim() || undefined, frequency, color });
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: editing ? "Habit updated" : "Habit added" });
      setOpen(false);
      if (!editing) { setName(""); setDescription(""); setFrequency("daily"); setColor("emerald"); }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5">
            {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Edit" : "Add habit"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit habit" : "New habit"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Name" required>
            <Input
              placeholder="e.g. Morning run"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </Field>
          <Field label="Description">
            <Textarea
              placeholder="Optional notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Frequency">
              <NativeSelect value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                {HABIT_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Colour">
              <NativeSelect value={color} onChange={(e) => setColor(e.target.value)}>
                {HABIT_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <DialogFooter className={editing ? "sm:justify-between" : undefined}>
            {editing && (
              <FormDeleteButton
                label="Delete habit"
                onDelete={async () => {
                  const r = await deleteHabit(habit!.id);
                  if (!r?.error) { toast({ title: "Habit deleted" }); setOpen(false); }
                  return r;
                }}
              />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {editing ? "Save changes" : "Add habit"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
