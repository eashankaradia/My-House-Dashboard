"use client";

import * as React from "react";
import { ExternalLink, Pencil, Plus, Trophy, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/shared/form-field";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { PB_UNITS } from "@/lib/constants";
import type { Exercise, ExerciseLink, ExercisePersonalBest } from "@/lib/database.types";
import { ExerciseForm } from "./exercise-form";
import { addPersonalBest, deletePersonalBest } from "./actions";

type Props = {
  exercise: Exercise | null;
  links: ExerciseLink[];
  personalBests: ExercisePersonalBest[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ExerciseDetailDialog({ exercise, links, personalBests, open, onOpenChange }: Props) {
  if (!exercise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="flex-row items-center justify-between space-y-0 pr-6">
          <DialogTitle>{exercise.name}</DialogTitle>
          <ExerciseForm
            exercise={exercise}
            links={links}
            trigger={
              <Button type="button" variant="outline" size="icon" aria-label="Edit exercise">
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />
        </DialogHeader>

        <div className="space-y-4">
          {exercise.muscle_groups.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {exercise.muscle_groups.map((m) => (
                <Badge key={m} variant="secondary">{m}</Badge>
              ))}
            </div>
          ) : null}

          {exercise.technique ? (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Technique / form cues</p>
              <p className="whitespace-pre-wrap text-sm">{exercise.technique}</p>
            </div>
          ) : null}

          {exercise.inspiration ? (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Inspiration</p>
              <p className="whitespace-pre-wrap text-sm">{exercise.inspiration}</p>
            </div>
          ) : null}

          {links.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Links</p>
              <div className="space-y-1.5">
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:underline"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{link.label || link.url}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <PersonalBests exerciseId={exercise.id} personalBests={personalBests} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PersonalBests({ exerciseId, personalBests }: { exerciseId: string; personalBests: ExercisePersonalBest[] }) {
  const [adding, setAdding] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [unit, setUnit] = React.useState<(typeof PB_UNITS)[number]>("kg");
  const [achievedOn, setAchievedOn] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const sorted = [...personalBests].sort((a, b) => b.achieved_on.localeCompare(a.achieved_on));
  const best = sorted[0];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const num = Number(value);
    if (!value.trim() || Number.isNaN(num)) return;
    startTransition(async () => {
      const result = await addPersonalBest({ exercise_id: exerciseId, value: num, unit, achieved_on: achievedOn });
      if (result?.error) {
        toast({ variant: "destructive", title: "Couldn't save", description: result.error });
        return;
      }
      toast({ title: "Personal best added" });
      setValue("");
      setAdding(false);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Personal bests</p>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            aria-label="Add personal best"
            className="text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {best ? (
        <div className="flex items-center gap-2 rounded-lg border bg-amber-500/10 px-3 py-2.5">
          <Trophy className="h-5 w-5 shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{best.value}{best.unit}</p>
            <p className="text-xs text-muted-foreground">{formatDate(best.achieved_on)}</p>
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
          No personal bests logged yet.
        </p>
      )}

      {adding ? (
        <form onSubmit={submit} className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <div className="grid grid-cols-3 gap-2">
            <Field label="Value" className="col-span-1">
              <Input type="number" step="0.01" autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
            </Field>
            <Field label="Unit" className="col-span-1">
              <NativeSelect value={unit} onChange={(e) => setUnit(e.target.value as (typeof PB_UNITS)[number])}>
                {PB_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Date" className="col-span-1">
              <Input type="date" value={achievedOn} onChange={(e) => setAchievedOn(e.target.value)} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={pending || !value.trim()}>{pending ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      ) : null}

      {sorted.length > 1 ? (
        <div className="space-y-1">
          {sorted.slice(1).map((pb) => (
            <div key={pb.id} className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
              <span className="min-w-0 flex-1">
                {pb.value}{pb.unit} <span className="text-xs text-muted-foreground">· {formatDate(pb.achieved_on)}</span>
              </span>
              <button
                type="button"
                onClick={() => startTransition(async () => void (await deletePersonalBest(pb.id)))}
                disabled={pending}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Remove entry"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
