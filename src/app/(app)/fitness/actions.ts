"use server";

import { getActionContext } from "@/lib/action-utils";
import { revalidatePath } from "next/cache";

export async function createWorkout(input: {
  name: string;
  workout_date: string;
  duration_minutes?: number;
  workout_type?: string;
  notes?: string;
}) {
  const { supabase, user } = await getActionContext();
  const { data, error } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      name: input.name,
      workout_date: input.workout_date,
      duration_minutes: input.duration_minutes ?? null,
      workout_type: input.workout_type ?? "Strength",
      notes: input.notes ?? null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/fitness");
  return { id: data.id };
}

export async function updateWorkout(
  id: string,
  input: Partial<{
    name: string;
    workout_date: string;
    duration_minutes: number;
    workout_type: string;
    notes: string;
  }>,
) {
  const { supabase } = await getActionContext();
  const { error } = await supabase
    .from("workouts")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/fitness");
}

export async function deleteWorkout(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/fitness");
}

export async function addExercise(input: {
  workout_id: string;
  name: string;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  duration_seconds?: number;
  distance_meters?: number;
  notes?: string;
}) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("workout_exercises").insert({
    user_id: user.id,
    workout_id: input.workout_id,
    name: input.name,
    sets: input.sets ?? null,
    reps: input.reps ?? null,
    weight_kg: input.weight_kg ?? null,
    duration_seconds: input.duration_seconds ?? null,
    distance_meters: input.distance_meters ?? null,
    notes: input.notes ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/fitness");
}

export async function deleteExercise(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("workout_exercises").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/fitness");
}
