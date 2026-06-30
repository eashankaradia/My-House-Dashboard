import { ChefHat } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { Recipe, RecipeIngredient } from "@/lib/database.types";
import { NutritionView } from "./nutrition-view";
import { RecipeForm } from "./recipe-form";

export const metadata = { title: "Nutrition" };

export default async function NutritionPage() {
  const supabase = await createClient();

  const [recipesRes, ingredientsRes] = await Promise.all([
    supabase.from("recipes").select("*").order("created_at", { ascending: false }),
    supabase.from("recipe_ingredients").select("*").order("order_index", { ascending: true }),
  ]);

  const recipes = (recipesRes.data ?? []) as Recipe[];
  const ingredients = (ingredientsRes.data ?? []) as RecipeIngredient[];

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
    </div>
  );
}
