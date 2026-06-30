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

export async function createHabit(input: {
  name: string;
  description?: string;
  frequency: string;
  color?: string;
  target_count?: number;
}) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    name: input.name,
    description: input.description ?? null,
    frequency: input.frequency,
    color: input.color ?? null,
    target_count: input.target_count ?? 1,
    is_active: true,
  });
  if (error) return { error: error.message };
  revalidatePath("/habits");
}

export async function updateHabit(id: string, input: Partial<{ name: string; description: string; frequency: string; color: string; is_active: boolean }>) {
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
