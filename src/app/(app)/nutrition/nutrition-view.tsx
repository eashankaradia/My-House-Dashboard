"use client";

import * as React from "react";
import { Film, ChefHat } from "lucide-react";
import type { Recipe, RecipeIngredient } from "@/lib/database.types";
import { RecipeDetailDialog } from "./recipe-detail-dialog";

export function NutritionView({ recipes, ingredients }: { recipes: Recipe[]; ingredients: RecipeIngredient[] }) {
  const [active, setActive] = React.useState<Recipe | null>(null);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => {
        const count = ingredients.filter((i) => i.recipe_id === recipe.id).length;
        return (
          <button
            key={recipe.id}
            onClick={() => setActive(recipe)}
            className="overflow-hidden rounded-xl border bg-card text-left transition-all active:scale-[0.99]"
          >
            <div className="flex aspect-video items-center justify-center bg-muted">
              {recipe.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={recipe.image_url} alt={recipe.name} className="h-full w-full object-cover" />
              ) : (
                <ChefHat className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1 p-3">
              <p className="font-medium">{recipe.name}</p>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                {recipe.calories ? `${recipe.calories} kcal` : null}
                {count > 0 ? ` · ${count} ingredient${count === 1 ? "" : "s"}` : ""}
                {recipe.video_url ? <Film className="h-3 w-3" /> : null}
              </p>
            </div>
          </button>
        );
      })}

      <RecipeDetailDialog recipe={active} ingredients={ingredients} open={Boolean(active)} onOpenChange={(v) => !v && setActive(null)} />
    </div>
  );
}
