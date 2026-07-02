"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Film, ChefHat } from "lucide-react";
import { SearchInput } from "@/components/shared/search-input";
import { cn } from "@/lib/utils";
import type { Recipe, RecipeIngredient } from "@/lib/database.types";
import { RecipeDetailDialog } from "./recipe-detail-dialog";

export function NutritionView({ recipes, ingredients }: { recipes: Recipe[]; ingredients: RecipeIngredient[] }) {
  const [active, setActive] = React.useState<Recipe | null>(null);
  const [compact, setCompact] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Deep-link support: ?recipe=<id> opens that recipe's detail dialog.
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const recipeParam = searchParams.get("recipe");

  React.useEffect(() => {
    if (recipeParam) {
      const r = recipes.find((x) => x.id === recipeParam);
      if (r) setActive(r);
    }
  }, [recipeParam, recipes]);

  function closeActive() {
    setActive(null);
    if (recipeParam) {
      const sp = new URLSearchParams(Array.from(searchParams.entries()));
      sp.delete("recipe");
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  const visible = recipes.filter((r) =>
    !search.trim() ? true : r.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search recipes…" className="w-full sm:w-48" />
        <div className="flex items-center rounded-lg border p-0.5 text-xs">
          <button onClick={() => setCompact(false)} className={cn("rounded-md px-2 py-1", !compact && "bg-accent")}>
            Detailed
          </button>
          <button onClick={() => setCompact(true)} className={cn("rounded-md px-2 py-1", compact && "bg-accent")}>
            Compact
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No recipes match that search.
        </p>
      ) : compact ? (
        <div className="divide-y rounded-lg border">
          {visible.map((recipe) => {
            const count = ingredients.filter((i) => i.recipe_id === recipe.id).length;
            return (
              <button
                key={recipe.id}
                onClick={() => setActive(recipe)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent/50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {recipe.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={recipe.image_url} alt="" className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <ChefHat className="h-4 w-4 text-muted-foreground" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{recipe.name}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  {recipe.calories ? `${recipe.calories} kcal` : null}
                  {count > 0 ? ` · ${count} ing.` : ""}
                  {recipe.video_url ? <Film className="h-3 w-3" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((recipe) => {
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
        </div>
      )}

      <RecipeDetailDialog recipe={active} ingredients={ingredients} open={Boolean(active)} onOpenChange={(v) => !v && closeActive()} />
    </div>
  );
}
