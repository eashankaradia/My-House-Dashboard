"use client";

import * as React from "react";
import { Plus, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form-field";
import { FormDeleteButton } from "@/components/shared/form-delete-button";
import { ImageUpload } from "@/components/shared/image-upload";
import { useToast } from "@/hooks/use-toast";
import type { Recipe, RecipeIngredient } from "@/lib/database.types";
import { createRecipe, updateRecipe, deleteRecipe } from "./actions";

type Props = { recipe?: Recipe; ingredients?: RecipeIngredient[]; trigger?: React.ReactNode };

type IngredientRow = { name: string; quantity: string };

export function RecipeForm({ recipe, ingredients = [], trigger }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(recipe);

  const [name, setName] = React.useState(recipe?.name ?? "");
  const [videoUrl, setVideoUrl] = React.useState(recipe?.video_url ?? "");
  const [imageUrl, setImageUrl] = React.useState<string | null>(recipe?.image_url ?? null);
  const [servings, setServings] = React.useState(recipe?.servings != null ? String(recipe.servings) : "");
  const [calories, setCalories] = React.useState(recipe?.calories != null ? String(recipe.calories) : "");
  const [protein, setProtein] = React.useState(recipe?.protein_g != null ? String(recipe.protein_g) : "");
  const [carbs, setCarbs] = React.useState(recipe?.carbs_g != null ? String(recipe.carbs_g) : "");
  const [fat, setFat] = React.useState(recipe?.fat_g != null ? String(recipe.fat_g) : "");
  const [notes, setNotes] = React.useState(recipe?.notes ?? "");
  const [rows, setRows] = React.useState<IngredientRow[]>(
    ingredients.length > 0 ? ingredients.map((i) => ({ name: i.name, quantity: i.quantity ?? "" })) : [{ name: "", quantity: "" }],
  );

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v && recipe) {
      setName(recipe.name);
      setVideoUrl(recipe.video_url ?? "");
      setImageUrl(recipe.image_url ?? null);
      setServings(recipe.servings != null ? String(recipe.servings) : "");
      setCalories(recipe.calories != null ? String(recipe.calories) : "");
      setProtein(recipe.protein_g != null ? String(recipe.protein_g) : "");
      setCarbs(recipe.carbs_g != null ? String(recipe.carbs_g) : "");
      setFat(recipe.fat_g != null ? String(recipe.fat_g) : "");
      setNotes(recipe.notes ?? "");
      setRows(ingredients.length > 0 ? ingredients.map((i) => ({ name: i.name, quantity: i.quantity ?? "" })) : [{ name: "", quantity: "" }]);
    }
  }

  function setRow(i: number, patch: Partial<IngredientRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { name: "", quantity: "" }]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const payload = {
        name: name.trim(),
        video_url: videoUrl.trim() || undefined,
        image_url: imageUrl ?? undefined,
        servings: servings ? Number(servings) : undefined,
        calories: calories ? Number(calories) : undefined,
        protein_g: protein ? Number(protein) : undefined,
        carbs_g: carbs ? Number(carbs) : undefined,
        fat_g: fat ? Number(fat) : undefined,
        notes: notes.trim() || undefined,
      };
      const result = editing
        ? await updateRecipe(recipe!.id, payload, rows)
        : await createRecipe({ ...payload, ingredients: rows });
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: editing ? "Recipe updated" : "Recipe added" });
      setOpen(false);
      if (!editing) {
        setName("");
        setVideoUrl("");
        setImageUrl(null);
        setServings("");
        setCalories("");
        setProtein("");
        setCarbs("");
        setFat("");
        setNotes("");
        setRows([{ name: "", quantity: "" }]);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5">
            {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Edit" : "Add recipe"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit recipe" : "New recipe"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Name" required>
            <Input placeholder="e.g. Chicken stir fry" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </Field>

          <Field label="Photo">
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </Field>

          <Field label="Video link" hint="A YouTube/TikTok/Instagram link to the recipe video">
            <Input placeholder="https://..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
          </Field>

          <Field label="Ingredients">
            <div className="space-y-1.5">
              {rows.map((row, i) => (
                <div key={i} className="flex gap-1.5">
                  <Input
                    placeholder="Ingredient"
                    value={row.name}
                    onChange={(e) => setRow(i, { name: e.target.value })}
                    className="flex-[2]"
                  />
                  <Input
                    placeholder="Quantity"
                    value={row.quantity}
                    onChange={(e) => setRow(i, { quantity: e.target.value })}
                    className="flex-1"
                  />
                  <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeRow(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addRow}>
                <Plus className="h-4 w-4" /> Add ingredient
              </Button>
            </div>
          </Field>

          <Field label="Servings">
            <Input type="number" min="1" placeholder="e.g. 4" value={servings} onChange={(e) => setServings(e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Calories (kcal)">
              <Input type="number" min="0" value={calories} onChange={(e) => setCalories(e.target.value)} />
            </Field>
            <Field label="Protein (g)">
              <Input type="number" min="0" value={protein} onChange={(e) => setProtein(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Carbs (g)">
              <Input type="number" min="0" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
            </Field>
            <Field label="Fat (g)">
              <Input type="number" min="0" value={fat} onChange={(e) => setFat(e.target.value)} />
            </Field>
          </div>

          <Field label="Method / notes">
            <Textarea placeholder="Steps, tips..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </Field>

          <DialogFooter className={editing ? "sm:justify-between" : undefined}>
            {editing && (
              <FormDeleteButton
                label="Delete recipe"
                onDelete={async () => {
                  const r = await deleteRecipe(recipe!.id);
                  if (!r?.error) {
                    toast({ title: "Recipe deleted" });
                    setOpen(false);
                  }
                  return r;
                }}
              />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {editing ? "Save changes" : "Add recipe"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
