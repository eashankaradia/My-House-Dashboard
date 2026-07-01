"use server";

import { getActionContext } from "@/lib/action-utils";
import { revalidatePath } from "next/cache";

// ─── Exercises (library) ─────────────────────────────────────────────────────

export async function createExercise(input: {
  name: string;
  muscle_groups: string[];
  technique?: string;
  inspiration?: string;
  pb_value?: number;
  pb_unit?: string;
  pb_date?: string;
}) {
  const { supabase, user } = await getActionContext();
  const { data, error } = await supabase
    .from("exercises")
    .insert({
      user_id: user.id,
      name: input.name,
      muscle_groups: input.muscle_groups,
      technique: input.technique ?? null,
      inspiration: input.inspiration ?? null,
      pb_value: input.pb_value ?? null,
      pb_unit: input.pb_unit ?? null,
      pb_date: input.pb_date ?? null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/fitness");
  return { id: data.id as string };
}

export async function updateExercise(
  id: string,
  input: Partial<{
    name: string;
    muscle_groups: string[];
    technique: string | null;
    inspiration: string | null;
    pb_value: number | null;
    pb_unit: string | null;
    pb_date: string | null;
  }>,
) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("exercises").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/fitness");
}

export async function deleteExercise(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/fitness");
}

// ─── Workout plans ────────────────────────────────────────────────────────────

export async function createWorkoutPlan(input: { name: string; description?: string }) {
  const { supabase, user } = await getActionContext();
  const { data, error } = await supabase
    .from("workout_plans")
    .insert({ user_id: user.id, name: input.name, description: input.description ?? null })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/fitness");
  return { id: data.id as string };
}

export async function updateWorkoutPlan(id: string, input: Partial<{ name: string; description: string | null; is_active: boolean }>) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("workout_plans").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/fitness");
}

export async function deleteWorkoutPlan(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("workout_plans").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/fitness");
}

// ─── Plan ↔ exercise links ────────────────────────────────────────────────────

export async function addExerciseToPlan(input: {
  plan_id: string;
  exercise_id: string;
  sets?: number;
  reps?: number;
  target_weight_kg?: number;
  order_index?: number;
  notes?: string;
}) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("workout_plan_exercises").insert({
    user_id: user.id,
    plan_id: input.plan_id,
    exercise_id: input.exercise_id,
    sets: input.sets ?? null,
    reps: input.reps ?? null,
    target_weight_kg: input.target_weight_kg ?? null,
    order_index: input.order_index ?? 0,
    notes: input.notes ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/fitness");
}

export async function updatePlanExercise(
  id: string,
  input: Partial<{ sets: number | null; reps: number | null; target_weight_kg: number | null; order_index: number; notes: string | null }>,
) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("workout_plan_exercises").update(input).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/fitness");
}

export async function removeExerciseFromPlan(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("workout_plan_exercises").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/fitness");
}

// ─── Muscle links (reference guides, e.g. Instagram tutorials) ────────────────

export async function createMuscleLink(input: { muscle_group: string; url: string; label?: string }) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("muscle_links").insert({
    user_id: user.id,
    muscle_group: input.muscle_group,
    url: input.url,
    label: input.label ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/fitness");
}

export async function deleteMuscleLink(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("muscle_links").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/fitness");
}
