"use server";

import { getActionContext } from "@/lib/action-utils";
import { revalidatePath } from "next/cache";

type IngredientInput = { name: string; quantity?: string };

export async function createRecipe(input: {
  name: string;
  video_url?: string;
  image_url?: string;
  servings?: number;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  notes?: string;
  ingredients: IngredientInput[];
}) {
  const { supabase, user } = await getActionContext();
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      name: input.name,
      video_url: input.video_url ?? null,
      image_url: input.image_url ?? null,
      servings: input.servings ?? null,
      calories: input.calories ?? null,
      protein_g: input.protein_g ?? null,
      carbs_g: input.carbs_g ?? null,
      fat_g: input.fat_g ?? null,
      notes: input.notes ?? null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const ingredients = input.ingredients.filter((i) => i.name.trim());
  if (ingredients.length > 0) {
    const { error: ingError } = await supabase.from("recipe_ingredients").insert(
      ingredients.map((ing, i) => ({
        user_id: user.id,
        recipe_id: data.id,
        name: ing.name.trim(),
        quantity: ing.quantity?.trim() || null,
        order_index: i,
      })),
    );
    if (ingError) return { error: ingError.message };
  }

  revalidatePath("/nutrition");
  return { id: data.id as string };
}

export async function updateRecipe(
  id: string,
  input: Partial<{
    name: string;
    video_url: string | null;
    image_url: string | null;
    servings: number | null;
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    notes: string | null;
  }>,
  ingredients?: IngredientInput[],
) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("recipes").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };

  if (ingredients) {
    await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);
    const filtered = ingredients.filter((i) => i.name.trim());
    if (filtered.length > 0) {
      const { error: ingError } = await supabase.from("recipe_ingredients").insert(
        filtered.map((ing, i) => ({
          user_id: user.id,
          recipe_id: id,
          name: ing.name.trim(),
          quantity: ing.quantity?.trim() || null,
          order_index: i,
        })),
      );
      if (ingError) return { error: ingError.message };
    }
  }

  revalidatePath("/nutrition");
}

export async function deleteRecipe(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/nutrition");
}

// --- Inspiration (reels & guides) -------------------------------------------

export async function createNutritionInspiration(input: { kind: string; title: string; url?: string; image_url?: string; source?: string; content?: string }) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("nutrition_inspiration").insert({
    user_id: user.id,
    kind: input.kind,
    title: input.title,
    url: input.url ?? null,
    image_url: input.image_url ?? null,
    source: input.source ?? null,
    content: input.content ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/nutrition");
}

export async function updateNutritionInspiration(
  id: string,
  input: Partial<{ kind: string; title: string; url: string | null; image_url: string | null; source: string | null; content: string | null }>,
) {
  const { supabase } = await getActionContext();
  const { error } = await supabase
    .from("nutrition_inspiration")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/nutrition");
}

export async function deleteNutritionInspiration(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("nutrition_inspiration").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/nutrition");
}
