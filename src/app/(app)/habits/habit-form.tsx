"use client";

import * as React from "react";
import { Plus, Pencil, X } from "lucide-react";
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
import { TagInput } from "@/components/shared/tag-input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  HABIT_FREQUENCIES,
  HABIT_COLORS,
  HABIT_TYPES,
  HABIT_TYPE_LABELS,
  HABIT_TARGET_PERIODS,
  HABIT_TARGET_PERIOD_LABELS,
  TIME_OF_DAY_TAGS,
} from "@/lib/constants";
import type { Habit, HabitTarget } from "@/lib/database.types";
import { createHabit, updateHabit, deleteHabit, upsertHabitTarget, deleteHabitTarget } from "./actions";

type Props = { habit?: Habit; targets?: HabitTarget[]; trigger?: React.ReactNode };

export function HabitForm({ habit, targets = [], trigger }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(habit);

  const [name, setName] = React.useState(habit?.name ?? "");
  const [description, setDescription] = React.useState(habit?.description ?? "");
  const [frequency, setFrequency] = React.useState(habit?.frequency ?? "daily");
  const [color, setColor] = React.useState(habit?.color ?? "emerald");
  const [habitType, setHabitType] = React.useState(habit?.habit_type ?? "yes_no");
  const [unit, setUnit] = React.useState(habit?.unit ?? "");
  const [why, setWhy] = React.useState(habit?.why ?? "");
  const [tags, setTags] = React.useState<string[]>(habit?.tags ?? []);

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v && habit) {
      setName(habit.name);
      setDescription(habit.description ?? "");
      setFrequency(habit.frequency);
      setColor(habit.color ?? "emerald");
      setHabitType(habit.habit_type ?? "yes_no");
      setUnit(habit.unit ?? "");
      setWhy(habit.why ?? "");
      setTags(habit.tags ?? []);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        frequency,
        color,
        habit_type: habitType,
        unit: habitType === "numeric" ? unit.trim() || undefined : undefined,
        why: why.trim() || undefined,
        tags,
      };
      const result = editing ? await updateHabit(habit!.id, payload) : await createHabit(payload);
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: editing ? "Habit updated" : "Habit added" });
      setOpen(false);
      if (!editing) {
        setName("");
        setDescription("");
        setFrequency("daily");
        setColor("emerald");
        setHabitType("yes_no");
        setUnit("");
        setWhy("");
        setTags([]);
      }
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
          <Field label="Why does this matter?" htmlFor="habit-why">
            <Textarea
              id="habit-why"
              placeholder="Your inspiration for this habit — what keeps you going?"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              rows={2}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <NativeSelect value={habitType} onChange={(e) => setHabitType(e.target.value)}>
                {HABIT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {HABIT_TYPE_LABELS[t]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Frequency">
              <NativeSelect value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                {HABIT_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {habitType === "numeric" && (
              <Field label="Unit">
                <Input placeholder="e.g. glasses, pages, km" value={unit} onChange={(e) => setUnit(e.target.value)} />
              </Field>
            )}
            <Field label="Colour" className={habitType === "numeric" ? undefined : "col-span-2"}>
              <NativeSelect value={color} onChange={(e) => setColor(e.target.value)}>
                {HABIT_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <Field label="Tags" hint="Tag a habit Morning/Day/Evening to group it into that section at the end of your Habits list.">
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                {TIME_OF_DAY_TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs",
                      tags.includes(t) ? "border-primary bg-accent" : "text-muted-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <TagInput value={tags} onChange={setTags} placeholder="Add another tag…" />
            </div>
          </Field>

          {editing && <TargetsEditor habitId={habit!.id} targets={targets} />}

          <DialogFooter className={editing ? "sm:justify-between" : undefined}>
            {editing && (
              <FormDeleteButton
                label="Delete habit"
                onDelete={async () => {
                  const r = await deleteHabit(habit!.id);
                  if (!r?.error) {
                    toast({ title: "Habit deleted" });
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
                {editing ? "Save changes" : "Add habit"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TargetsEditor({ habitId, targets }: { habitId: string; targets: HabitTarget[] }) {
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const [period, setPeriod] = React.useState<string>("day");
  const [value, setValue] = React.useState("");

  const byPeriod = new Map(targets.map((t) => [t.period, t]));

  function add() {
    const num = Number(value);
    if (!num || num <= 0) return;
    startTransition(async () => {
      const r = await upsertHabitTarget({ habit_id: habitId, period, target_value: num });
      if (r?.error) {
        toast({ variant: "destructive", title: "Couldn't save target", description: r.error });
        return;
      }
      setValue("");
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteHabitTarget(id);
    });
  }

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Targets</p>
      {targets.length > 0 && (
        <div className="space-y-1.5">
          {targets.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-md bg-background px-2.5 py-1.5 text-sm">
              <span>
                {HABIT_TARGET_PERIOD_LABELS[t.period] ?? t.period}: <strong>{t.target_value}</strong>
              </span>
              <button type="button" onClick={() => remove(t.id)} className="text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <NativeSelect value={period} onChange={(e) => setPeriod(e.target.value)} className="flex-1">
          {HABIT_TARGET_PERIODS.filter((p) => !byPeriod.has(p) || p === period).map((p) => (
            <option key={p} value={p}>
              {HABIT_TARGET_PERIOD_LABELS[p]}
            </option>
          ))}
        </NativeSelect>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="Target"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-24"
        />
        <Button type="button" size="sm" variant="secondary" disabled={pending || !value} onClick={add}>
          Set
        </Button>
      </div>
    </div>
  );
}
