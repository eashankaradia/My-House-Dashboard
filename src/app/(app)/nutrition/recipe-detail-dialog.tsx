"use client";

import { Film, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Recipe, RecipeIngredient } from "@/lib/database.types";
import { RecipeForm } from "./recipe-form";

type Props = {
  recipe: Recipe | null;
  ingredients: RecipeIngredient[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RecipeDetailDialog({ recipe, ingredients, open, onOpenChange }: Props) {
  if (!recipe) return null;
  const recipeIngredients = ingredients.filter((i) => i.recipe_id === recipe.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{recipe.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {recipe.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={recipe.image_url} alt={recipe.name} className="aspect-video w-full rounded-lg object-cover" />
          )}

          {recipe.video_url && (
            <a
              href={recipe.video_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Film className="h-4 w-4" /> Watch the video
            </a>
          )}

          {(recipe.calories || recipe.protein_g || recipe.carbs_g || recipe.fat_g) && (
            <div className="grid grid-cols-4 gap-2 rounded-lg border bg-muted/30 p-3 text-center">
              <Stat label="kcal" value={recipe.calories} />
              <Stat label="protein" value={recipe.protein_g} unit="g" />
              <Stat label="carbs" value={recipe.carbs_g} unit="g" />
              <Stat label="fat" value={recipe.fat_g} unit="g" />
            </div>
          )}

          {recipe.servings && <p className="text-sm text-muted-foreground">Serves {recipe.servings}</p>}

          {recipeIngredients.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ingredients</p>
              <ul className="space-y-1 text-sm">
                {recipeIngredients.map((ing) => (
                  <li key={ing.id} className="flex justify-between">
                    <span>{ing.name}</span>
                    {ing.quantity && <span className="text-muted-foreground">{ing.quantity}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recipe.notes && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Method</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{recipe.notes}</p>
            </div>
          )}

          <div className="flex justify-end border-t pt-3">
            <RecipeForm
              recipe={recipe}
              ingredients={recipeIngredients}
              trigger={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Pencil className="h-4 w-4" /> Edit recipe
                </Button>
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, unit }: { label: string; value: number | null; unit?: string }) {
  if (value == null) return null;
  return (
    <div>
      <p className="text-sm font-semibold">
        {value}
        {unit}
      </p>
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
    </div>
  );
}
