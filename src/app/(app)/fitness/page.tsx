import { Dumbbell } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { Exercise, MuscleLink, WorkoutPlan, WorkoutPlanExercise } from "@/lib/database.types";
import { FitnessView } from "./fitness-view";
import { PlanForm } from "./plan-form";
import { ExerciseForm } from "./exercise-form";

export const metadata = { title: "Fitness" };

export default async function FitnessPage() {
  const supabase = await createClient();

  const [plansRes, planExercisesRes, exercisesRes, muscleLinksRes] = await Promise.all([
    supabase.from("workout_plans").select("*").eq("is_active", true).order("created_at", { ascending: true }),
    supabase.from("workout_plan_exercises").select("*").order("order_index", { ascending: true }),
    supabase.from("exercises").select("*").order("name", { ascending: true }),
    supabase.from("muscle_links").select("*").order("created_at", { ascending: false }),
  ]);

  const plans = (plansRes.data ?? []) as WorkoutPlan[];
  const planExercises = (planExercisesRes.data ?? []) as WorkoutPlanExercise[];
  const exercises = (exercisesRes.data ?? []) as Exercise[];
  const muscleLinks = (muscleLinksRes.data ?? []) as MuscleLink[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fitness"
        description="Build workout plans from a reusable exercise library."
        info="Create exercises with PBs, technique notes and inspiration, tag the muscles they work, then group them into plans."
      >
        <div className="flex gap-2">
          <ExerciseForm />
          <PlanForm />
        </div>
      </PageHeader>

      {plans.length === 0 && exercises.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No workout plans yet"
          description="Start by adding an exercise to your library — name, muscles worked, technique and a PB — then group exercises into a plan."
        >
          <div className="flex gap-2">
            <ExerciseForm />
            <PlanForm />
          </div>
        </EmptyState>
      ) : (
        <FitnessView plans={plans} planExercises={planExercises} exercises={exercises} muscleLinks={muscleLinks} />
      )}
    </div>
  );
}
