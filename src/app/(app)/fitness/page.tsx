import { Dumbbell, Flame, Activity, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { Workout, WorkoutExercise } from "@/lib/database.types";
import { WorkoutForm } from "./workout-form";

export const metadata = { title: "Fitness" };

const TYPE_COLORS: Record<string, string> = {
  Strength: "bg-orange-500/10 text-orange-500",
  Cardio:   "bg-sky-500/10 text-sky-500",
  HIIT:     "bg-rose-500/10 text-rose-500",
  Yoga:     "bg-violet-500/10 text-violet-500",
  Run:      "bg-emerald-500/10 text-emerald-500",
  Walk:     "bg-teal-500/10 text-teal-500",
  Other:    "bg-muted text-muted-foreground",
};

export default async function FitnessPage() {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [workoutsRes, exercisesRes] = await Promise.all([
    supabase
      .from("workouts")
      .select("*")
      .order("workout_date", { ascending: false })
      .limit(20),
    supabase
      .from("workout_exercises")
      .select("*")
      .gte("created_at", thirtyDaysAgo + "T00:00:00"),
  ]);

  const workouts = (workoutsRes.data ?? []) as Workout[];
  const exercises = (exercisesRes.data ?? []) as WorkoutExercise[];

  const thisMonthWorkouts = workouts.filter((w) => w.workout_date >= thirtyDaysAgo);
  const totalMinutes = workouts.reduce((s, w) => s + (w.duration_minutes ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fitness"
        description="Track your workouts, monitor progress, and hit personal records."
      >
        <WorkoutForm />
      </PageHeader>

      {workouts.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No workouts logged yet"
          description="Start tracking your training. Log workouts, exercises, sets and reps. Watch your progressive overload over time."
        >
          <WorkoutForm />
        </EmptyState>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flame className="h-4 w-4" />
                <span className="text-xs font-medium">This month</span>
              </div>
              <p className="mt-1.5 text-2xl font-bold">{thisMonthWorkouts.length}</p>
              <p className="text-xs text-muted-foreground">workouts</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Timer className="h-4 w-4" />
                <span className="text-xs font-medium">Total time</span>
              </div>
              <p className="mt-1.5 text-2xl font-bold">{Math.round(totalMinutes / 60)}</p>
              <p className="text-xs text-muted-foreground">hours</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span className="text-xs font-medium">Exercises</span>
              </div>
              <p className="mt-1.5 text-2xl font-bold">{exercises.length}</p>
              <p className="text-xs text-muted-foreground">sets logged</p>
            </div>
          </div>

          {/* Workout list */}
          <section className="space-y-2">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recent workouts
            </h2>
            <div className="space-y-2">
              {workouts.map((workout) => {
                const typeClass = TYPE_COLORS[workout.workout_type ?? "Other"] ?? TYPE_COLORS.Other;
                const exCount = exercises.filter((e) => e.workout_id === workout.id).length;
                return (
                  <div key={workout.id} className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3.5">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeClass}`}>
                      <Dumbbell className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{workout.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(workout.workout_date + "T00:00:00").toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                        {workout.duration_minutes ? ` · ${workout.duration_minutes}min` : ""}
                        {exCount > 0 ? ` · ${exCount} exercise${exCount === 1 ? "" : "s"}` : ""}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {workout.workout_type ?? "Other"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
