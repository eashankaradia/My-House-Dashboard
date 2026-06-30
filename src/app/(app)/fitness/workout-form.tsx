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
import { WORKOUT_TYPES } from "@/lib/constants";
import type { Workout } from "@/lib/database.types";
import { createWorkout, updateWorkout, deleteWorkout } from "./actions";

type Props = { workout?: Workout; trigger?: React.ReactNode };

export function WorkoutForm({ workout, trigger }: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(workout);

  const [name, setName] = React.useState(workout?.name ?? "");
  const [workoutType, setWorkoutType] = React.useState(workout?.workout_type ?? "Strength");
  const [workoutDate, setWorkoutDate] = React.useState(workout?.workout_date ?? todayStr);
  const [duration, setDuration] = React.useState(workout?.duration_minutes != null ? String(workout.duration_minutes) : "");
  const [notes, setNotes] = React.useState(workout?.notes ?? "");

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v && workout) {
      setName(workout.name);
      setWorkoutType(workout.workout_type ?? "Strength");
      setWorkoutDate(workout.workout_date);
      setDuration(workout.duration_minutes != null ? String(workout.duration_minutes) : "");
      setNotes(workout.notes ?? "");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const input = {
        name: name.trim(),
        workout_type: workoutType,
        workout_date: workoutDate,
        duration_minutes: duration ? Number(duration) : undefined,
        notes: notes.trim() || undefined,
      };
      const result = editing
        ? await updateWorkout(workout!.id, input)
        : await createWorkout(input);
      if (result && "error" in result && result.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: editing ? "Workout updated" : "Workout logged" });
      setOpen(false);
      if (!editing) {
        setName(""); setWorkoutType("Strength");
        setWorkoutDate(todayStr); setDuration(""); setNotes("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5">
            {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Edit" : "Log workout"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit workout" : "Log a workout"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Name" required>
            <Input
              placeholder="e.g. Push day, Morning run..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <NativeSelect value={workoutType} onChange={(e) => setWorkoutType(e.target.value)}>
                {WORKOUT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Date">
              <Input type="date" value={workoutDate} onChange={(e) => setWorkoutDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Duration (minutes)">
            <Input
              type="number"
              placeholder="e.g. 45"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min={1}
            />
          </Field>
          <Field label="Notes">
            <Textarea
              placeholder="How did it go?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </Field>
          <DialogFooter className={editing ? "sm:justify-between" : undefined}>
            {editing && (
              <FormDeleteButton
                label="Delete workout"
                onDelete={async () => {
                  const r = await deleteWorkout(workout!.id);
                  if (!r?.error) { toast({ title: "Workout deleted" }); setOpen(false); }
                  return r;
                }}
              />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {editing ? "Save changes" : "Log workout"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
