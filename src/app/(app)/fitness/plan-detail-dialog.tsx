"use client";

import * as React from "react";
import { Plus, X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Exercise, WorkoutPlan, WorkoutPlanExercise } from "@/lib/database.types";
import { BodyDiagram } from "./body-diagram";
import { ExerciseForm } from "./exercise-form";
import { PlanForm } from "./plan-form";
import { addExerciseToPlan, removeExerciseFromPlan } from "./actions";

type Props = {
  plan: WorkoutPlan | null;
  planExercises: WorkoutPlanExercise[];
  exercises: Exercise[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PlanDetailDialog({ plan, planExercises, exercises, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const [pickId, setPickId] = React.useState("");
  const exerciseById = React.useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);

  if (!plan) return null;

  const linked = planExercises.filter((pe) => pe.plan_id === plan.id);
  const usedIds = new Set(linked.map((pe) => pe.exercise_id));
  const available = exercises.filter((e) => !usedIds.has(e.id));
  const muscles = Array.from(new Set(linked.flatMap((pe) => exerciseById.get(pe.exercise_id)?.muscle_groups ?? [])));

  function add(exerciseId: string) {
    startTransition(async () => {
      const r = await addExerciseToPlan({ plan_id: plan!.id, exercise_id: exerciseId, order_index: linked.length });
      if (r?.error) {
        toast({ variant: "destructive", title: "Couldn't add", description: r.error });
        return;
      }
      toast({ title: "Exercise added to plan" });
      setPickId("");
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await removeExerciseFromPlan(id);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{plan.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}

          <BodyDiagram highlighted={muscles} />

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Exercises</p>
            {linked.length === 0 ? (
              <p className="text-sm text-muted-foreground">No exercises yet — add one below.</p>
            ) : (
              <div className="space-y-1.5">
                {linked.map((pe) => {
                  const ex = exerciseById.get(pe.exercise_id);
                  if (!ex) return null;
                  return (
                    <div key={pe.id} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{ex.name}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                          {pe.sets && pe.reps ? <span>{pe.sets} × {pe.reps}</span> : null}
                          {pe.target_weight_kg ? <span>· {pe.target_weight_kg}kg</span> : null}
                          {ex.pb_value != null ? (
                            <span className="inline-flex items-center gap-0.5 text-amber-500">
                              <Trophy className="h-3 w-3" /> PB {ex.pb_value}{ex.pb_unit}
                            </span>
                          ) : null}
                        </div>
                        {ex.muscle_groups.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {ex.muscle_groups.map((m) => (
                              <Badge key={m} variant="secondary" className="text-[10px]">
                                {m}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={() => remove(pe.id)} disabled={pending} className="shrink-0 text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add an exercise</p>
            <div className="flex gap-2">
              <NativeSelect value={pickId} onChange={(e) => setPickId(e.target.value)} className="flex-1">
                <option value="">Choose from library...</option>
                {available.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </NativeSelect>
              <Button type="button" size="sm" disabled={pending || !pickId} onClick={() => add(pickId)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
            <ExerciseForm
              onCreated={(id) => add(id)}
              trigger={
                <Button type="button" size="sm" variant="ghost" className="w-full gap-1.5">
                  <Plus className="h-4 w-4" /> Or create a new exercise
                </Button>
              }
            />
          </div>

          <div className="flex justify-end border-t pt-3">
            <PlanForm plan={plan} trigger={<Button variant="outline" size="sm">Edit plan</Button>} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
