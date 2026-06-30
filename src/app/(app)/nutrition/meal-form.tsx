"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form-field";
import { useToast } from "@/hooks/use-toast";
import { MEAL_TYPES } from "@/lib/constants";
import { logMeal } from "./actions";

type Props = { trigger?: React.ReactNode; defaultDate?: string; defaultMealType?: string };

export function MealForm({ trigger, defaultDate, defaultMealType }: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const [logDate, setLogDate] = React.useState(defaultDate ?? todayStr);
  const [mealType, setMealType] = React.useState(defaultMealType ?? "Breakfast");
  const [name, setName] = React.useState("");
  const [calories, setCalories] = React.useState("");
  const [protein, setProtein] = React.useState("");
  const [carbs, setCarbs] = React.useState("");
  const [fat, setFat] = React.useState("");
  const [notes, setNotes] = React.useState("");

  function reset() {
    setName(""); setCalories(""); setProtein(""); setCarbs(""); setFat(""); setNotes("");
    setLogDate(defaultDate ?? todayStr);
    setMealType(defaultMealType ?? "Breakfast");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await logMeal({
        log_date: logDate,
        meal_type: mealType,
        name: name.trim(),
        calories: calories ? Number(calories) : undefined,
        protein_g: protein ? Number(protein) : undefined,
        carbs_g: carbs ? Number(carbs) : undefined,
        fat_g: fat ? Number(fat) : undefined,
        notes: notes.trim() || undefined,
      });
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: "Meal logged" });
      setOpen(false);
      reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Log meal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a meal</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Food / meal name" required>
            <Input
              placeholder="e.g. Chicken breast with rice"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Meal type">
              <NativeSelect value={mealType} onChange={(e) => setMealType(e.target.value)}>
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Date">
              <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Calories (kcal)">
              <Input type="number" placeholder="e.g. 450" value={calories} onChange={(e) => setCalories(e.target.value)} min={0} />
            </Field>
            <Field label="Protein (g)">
              <Input type="number" placeholder="e.g. 35" value={protein} onChange={(e) => setProtein(e.target.value)} min={0} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Carbs (g)">
              <Input type="number" placeholder="e.g. 50" value={carbs} onChange={(e) => setCarbs(e.target.value)} min={0} />
            </Field>
            <Field label="Fat (g)">
              <Input type="number" placeholder="e.g. 10" value={fat} onChange={(e) => setFat(e.target.value)} min={0} />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>Log meal</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
