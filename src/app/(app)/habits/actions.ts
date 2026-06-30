"use server";

import { getActionContext } from "@/lib/action-utils";
import { revalidatePath } from "next/cache";

export async function logHabit(habitId: string, date: string) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("habit_logs").upsert(
    { habit_id: habitId, user_id: user.id, logged_date: date, count: 1 },
    { onConflict: "habit_id,logged_date" },
  );
  if (error) return { error: error.message };
  revalidatePath("/habits");
  revalidatePath("/dashboard");
}

export async function unlogHabit(habitId: string, date: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase
    .from("habit_logs")
    .delete()
    .eq("habit_id", habitId)
    .eq("logged_date", date);
  if (error) return { error: error.message };
  revalidatePath("/habits");
  revalidatePath("/dashboard");
}

/** Log (or overwrite) a numeric value for a habit on a given day. */
export async function logHabitValue(habitId: string, date: string, value: number, notes?: string) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("habit_logs").upsert(
    { habit_id: habitId, user_id: user.id, logged_date: date, count: 1, value, notes: notes ?? null },
    { onConflict: "habit_id,logged_date" },
  );
  if (error) return { error: error.message };
  revalidatePath("/habits");
  revalidatePath("/dashboard");
}

/** Log (or add to) a timer habit's duration for a given day. Pass `add: true` to accumulate. */
export async function logHabitDuration(
  habitId: string,
  date: string,
  durationSeconds: number,
  options?: { add?: boolean; notes?: string },
) {
  const { supabase, user } = await getActionContext();
  let total = durationSeconds;
  if (options?.add) {
    const { data: existing } = await supabase
      .from("habit_logs")
      .select("duration_seconds")
      .eq("habit_id", habitId)
      .eq("logged_date", date)
      .maybeSingle();
    total += existing?.duration_seconds ?? 0;
  }
  const { error } = await supabase.from("habit_logs").upsert(
    { habit_id: habitId, user_id: user.id, logged_date: date, count: 1, duration_seconds: total, notes: options?.notes ?? null },
    { onConflict: "habit_id,logged_date" },
  );
  if (error) return { error: error.message };
  revalidatePath("/habits");
  revalidatePath("/dashboard");
}

export async function createHabit(input: {
  name: string;
  description?: string;
  frequency: string;
  color?: string;
  target_count?: number;
  habit_type?: string;
  why?: string;
  unit?: string;
}) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    name: input.name,
    description: input.description ?? null,
    frequency: input.frequency,
    color: input.color ?? null,
    target_count: input.target_count ?? 1,
    habit_type: input.habit_type ?? "yes_no",
    why: input.why ?? null,
    unit: input.unit ?? null,
    is_active: true,
  });
  if (error) return { error: error.message };
  revalidatePath("/habits");
}

export async function updateHabit(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    frequency: string;
    color: string;
    is_active: boolean;
    habit_type: string;
    why: string;
    unit: string;
  }>,
) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("habits").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/habits");
}

export async function deleteHabit(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("habits").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/habits");
}

export async function upsertHabitTarget(input: { habit_id: string; period: string; target_value: number }) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("habit_targets").upsert(
    { habit_id: input.habit_id, user_id: user.id, period: input.period, target_value: input.target_value },
    { onConflict: "habit_id,period" },
  );
  if (error) return { error: error.message };
  revalidatePath("/habits");
}

export async function deleteHabitTarget(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("habit_targets").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/habits");
}
