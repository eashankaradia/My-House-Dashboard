"use server";

import { getActionContext } from "@/lib/action-utils";
import { revalidatePath } from "next/cache";

export async function createGoal(input: {
  title: string;
  description?: string;
  category: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  target_date?: string;
}) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    title: input.title,
    description: input.description ?? null,
    category: input.category,
    target_value: input.target_value ?? null,
    current_value: input.current_value ?? 0,
    unit: input.unit ?? null,
    target_date: input.target_date ?? null,
    status: "Active",
  });
  if (error) return { error: error.message };
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function updateGoal(
  id: string,
  input: Partial<{
    title: string;
    description: string;
    category: string;
    target_value: number;
    current_value: number;
    unit: string;
    target_date: string;
    status: string;
  }>,
) {
  const { supabase } = await getActionContext();
  const { error } = await supabase
    .from("goals")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function deleteGoal(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/goals");
}
