"use server";

import { getActionContext } from "@/lib/action-utils";
import { revalidatePath } from "next/cache";

export async function toggleRoutineItem(itemId: string, date: string) {
  const { supabase, user } = await getActionContext();
  const { data: existing } = await supabase
    .from("routine_completions")
    .select("id")
    .eq("item_id", itemId)
    .eq("completed_date", date)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("routine_completions").delete().eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("routine_completions").insert({
      user_id: user.id,
      item_id: itemId,
      completed_date: date,
    });
    if (error) return { error: error.message };
  }
  revalidatePath("/routine");
}

export async function createRoutineItem(input: { section: string; name: string; order_index?: number }) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("routine_items").insert({
    user_id: user.id,
    section: input.section,
    name: input.name,
    order_index: input.order_index ?? 0,
  });
  if (error) return { error: error.message };
  revalidatePath("/routine");
}

export async function updateRoutineItem(id: string, input: Partial<{ section: string; name: string; order_index: number }>) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("routine_items").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/routine");
}

export async function deleteRoutineItem(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("routine_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/routine");
}
