import { ChefHat } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { NutritionInspiration, Recipe, RecipeIngredient } from "@/lib/database.types";
import { NutritionView } from "./nutrition-view";
import { RecipeForm } from "./recipe-form";
import { NutritionInspirationList } from "./nutrition-inspiration-list";
import { NutritionInspirationForm } from "./nutrition-inspiration-form";

export const metadata = { title: "Nutrition" };

export default async function NutritionPage() {
  const supabase = await createClient();

  const [recipesRes, ingredientsRes, inspirationRes] = await Promise.all([
    supabase.from("recipes").select("*").order("created_at", { ascending: false }),
    supabase.from("recipe_ingredients").select("*").order("order_index", { ascending: true }),
    supabase.from("nutrition_inspiration").select("*").order("created_at", { ascending: false }),
  ]);

  const recipes = (recipesRes.data ?? []) as Recipe[];
  const ingredients = (ingredientsRes.data ?? []) as RecipeIngredient[];
  const inspiration = (inspirationRes.data ?? []) as NutritionInspiration[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nutrition"
        description="Capture recipes — videos, ingredients and nutritional value."
      >
        <RecipeForm />
      </PageHeader>

      {recipes.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="No recipes yet"
          description="Save your go-to recipes: a video link, the ingredients, and the nutritional value per serving."
        >
          <RecipeForm />
        </EmptyState>
      ) : (
        <NutritionView recipes={recipes} ingredients={ingredients} />
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Inspiration &amp; guides</h2>
          <NutritionInspirationForm
            trigger={<button className="text-sm font-medium text-primary hover:underline">Add</button>}
          />
        </div>
        {inspiration.length > 0 ? (
          <NutritionInspirationList items={inspiration} />
        ) : (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Save reels and guides on nutrition, meal ideas, or cooking techniques.
          </p>
        )}
      </section>
    </div>
  );
}
