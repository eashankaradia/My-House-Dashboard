"use client";

import * as React from "react";
import { Trophy, ChevronRight, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MUSCLE_GROUPS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Exercise, WorkoutPlan, WorkoutPlanExercise } from "@/lib/database.types";
import { BodyDiagram } from "./body-diagram";
import { PlanDetailDialog } from "./plan-detail-dialog";
import { ExerciseForm } from "./exercise-form";

type Props = {
  plans: WorkoutPlan[];
  planExercises: WorkoutPlanExercise[];
  exercises: Exercise[];
};

export function FitnessView({ plans, planExercises, exercises }: Props) {
  const [activePlan, setActivePlan] = React.useState<WorkoutPlan | null>(null);
  const exerciseById = React.useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const [search, setSearch] = React.useState("");
  const [muscleFilter, setMuscleFilter] = React.useState<string | null>(null);
  const usedMuscles = React.useMemo(
    () => MUSCLE_GROUPS.filter((m) => exercises.some((e) => e.muscle_groups.includes(m))),
    [exercises],
  );
  const filteredExercises = React.useMemo(
    () =>
      exercises
        .filter((e) => !muscleFilter || e.muscle_groups.includes(muscleFilter))
        .filter((e) => !search.trim() || e.name.toLowerCase().includes(search.trim().toLowerCase())),
    [exercises, muscleFilter, search],
  );

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Plans</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => {
            const linked = planExercises.filter((pe) => pe.plan_id === plan.id);
            const muscles = Array.from(new Set(linked.flatMap((pe) => exerciseById.get(pe.exercise_id)?.muscle_groups ?? [])));
            return (
              <button
                key={plan.id}
                onClick={() => setActivePlan(plan)}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 text-left transition-all active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {linked.length} exercise{linked.length === 1 ? "" : "s"}
                    {muscles.length > 0 ? ` · ${muscles.join(", ")}` : ""}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Exercise library</h2>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises…"
            className="pl-9"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {usedMuscles.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMuscleFilter(null)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs",
                !muscleFilter ? "border-primary bg-accent" : "text-muted-foreground",
              )}
            >
              All
            </button>
            {usedMuscles.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMuscleFilter((cur) => (cur === m ? null : m))}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs",
                  muscleFilter === m ? "border-primary bg-accent" : "text-muted-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          {filteredExercises.map((ex) => (
            <ExerciseForm
              key={ex.id}
              exercise={ex}
              trigger={
                <button className="flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{ex.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {ex.muscle_groups.slice(0, 3).map((m) => (
                        <Badge key={m} variant="secondary" className="text-[10px]">
                          {m}
                        </Badge>
                      ))}
                      {ex.pb_value != null && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-amber-500">
                          <Trophy className="h-3 w-3" /> {ex.pb_value}
                          {ex.pb_unit}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              }
            />
          ))}
        </div>
        {exercises.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            No exercises in your library yet.
          </p>
        ) : filteredExercises.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            No exercises match this filter.
          </p>
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">What you train</h2>
        <div className="rounded-xl border bg-card p-4">
          <BodyDiagram highlighted={Array.from(new Set(exercises.flatMap((e) => e.muscle_groups)))} />
        </div>
      </section>

      <PlanDetailDialog
        plan={activePlan}
        planExercises={planExercises}
        exercises={exercises}
        open={Boolean(activePlan)}
        onOpenChange={(v) => !v && setActivePlan(null)}
      />
    </div>
  );
}
