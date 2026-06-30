"use server";

import { getActionContext } from "@/lib/action-utils";
import { revalidatePath } from "next/cache";

export async function logMeal(input: {
  log_date: string;
  meal_type: string;
  name: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  notes?: string;
}) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("nutrition_logs").insert({
    user_id: user.id,
    log_date: input.log_date,
    meal_type: input.meal_type,
    name: input.name,
    calories: input.calories ?? null,
    protein_g: input.protein_g ?? null,
    carbs_g: input.carbs_g ?? null,
    fat_g: input.fat_g ?? null,
    notes: input.notes ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/nutrition");
  revalidatePath("/dashboard");
}

export async function updateNutritionLog(id: string, input: Partial<{ name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; notes: string }>) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("nutrition_logs").update(input).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/nutrition");
}

export async function deleteNutritionLog(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("nutrition_logs").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/nutrition");
}
