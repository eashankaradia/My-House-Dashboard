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
import { cn } from "@/lib/utils";
import { MUSCLE_GROUPS, PB_UNITS } from "@/lib/constants";
import type { Exercise } from "@/lib/database.types";
import { createExercise, updateExercise, deleteExercise } from "./actions";

type Props = { exercise?: Exercise; trigger?: React.ReactNode; onCreated?: (id: string) => void };

export function ExerciseForm({ exercise, trigger, onCreated }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(exercise);

  const [name, setName] = React.useState(exercise?.name ?? "");
  const [muscles, setMuscles] = React.useState<string[]>(exercise?.muscle_groups ?? []);
  const [technique, setTechnique] = React.useState(exercise?.technique ?? "");
  const [inspiration, setInspiration] = React.useState(exercise?.inspiration ?? "");
  const [pbValue, setPbValue] = React.useState(exercise?.pb_value != null ? String(exercise.pb_value) : "");
  const [pbUnit, setPbUnit] = React.useState(exercise?.pb_unit ?? "kg");
  const [pbDate, setPbDate] = React.useState(exercise?.pb_date ?? "");

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v && exercise) {
      setName(exercise.name);
      setMuscles(exercise.muscle_groups);
      setTechnique(exercise.technique ?? "");
      setInspiration(exercise.inspiration ?? "");
      setPbValue(exercise.pb_value != null ? String(exercise.pb_value) : "");
      setPbUnit(exercise.pb_unit ?? "kg");
      setPbDate(exercise.pb_date ?? "");
    }
  }

  function toggleMuscle(m: string) {
    setMuscles((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const payload = {
        name: name.trim(),
        muscle_groups: muscles,
        technique: technique.trim() || undefined,
        inspiration: inspiration.trim() || undefined,
        pb_value: pbValue ? Number(pbValue) : undefined,
        pb_unit: pbValue ? pbUnit : undefined,
        pb_date: pbValue && pbDate ? pbDate : undefined,
      };
      const result = editing ? await updateExercise(exercise!.id, payload) : await createExercise(payload);
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: editing ? "Exercise updated" : "Exercise added" });
      setOpen(false);
      if (!editing) {
        if (result && "id" in result) onCreated?.(result.id);
        setName("");
        setMuscles([]);
        setTechnique("");
        setInspiration("");
        setPbValue("");
        setPbDate("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5">
            {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Edit" : "New exercise"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit exercise" : "New exercise"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Name" required>
            <Input placeholder="e.g. Barbell squat" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </Field>

          <Field label="Muscles worked">
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUPS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMuscle(m)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    muscles.includes(m) ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-muted-foreground",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Technique / form cues">
            <Textarea placeholder="Notes on form, cues to remember..." value={technique} onChange={(e) => setTechnique(e.target.value)} rows={2} />
          </Field>

          <Field label="Inspiration">
            <Textarea placeholder="Why this exercise, what motivates you..." value={inspiration} onChange={(e) => setInspiration(e.target.value)} rows={2} />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Personal best" className="col-span-2">
              <Input type="number" step="0.01" placeholder="0" value={pbValue} onChange={(e) => setPbValue(e.target.value)} />
            </Field>
            <Field label="Unit">
              <NativeSelect value={pbUnit} onChange={(e) => setPbUnit(e.target.value)}>
                {PB_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          {pbValue && (
            <Field label="PB date">
              <Input type="date" value={pbDate} onChange={(e) => setPbDate(e.target.value)} />
            </Field>
          )}

          <DialogFooter className={editing ? "sm:justify-between" : undefined}>
            {editing && (
              <FormDeleteButton
                label="Delete exercise"
                onDelete={async () => {
                  const r = await deleteExercise(exercise!.id);
                  if (!r?.error) {
                    toast({ title: "Exercise deleted" });
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
                {editing ? "Save changes" : "Add exercise"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
