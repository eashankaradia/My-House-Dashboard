import { Utensils, Plus, Beef, Wheat, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/server";
import type { NutritionLog } from "@/lib/database.types";
import { MEAL_TYPES } from "@/lib/constants";
import { MealForm } from "./meal-form";

export const metadata = { title: "Nutrition" };

const DAILY_TARGETS = {
  calories: 2000,
  protein_g: 150,
  carbs_g: 250,
  fat_g: 65,
};

export default async function NutritionPage() {
  const supabase = await createClient();

  const todayStr = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data } = await supabase
    .from("nutrition_logs")
    .select("*")
    .gte("log_date", sevenDaysAgo)
    .order("created_at", { ascending: false });

  const logs = (data ?? []) as NutritionLog[];
  const todayLogs = logs.filter((l) => l.log_date === todayStr);

  const todayTotals = todayLogs.reduce(
    (acc, l) => ({
      calories: acc.calories + (l.calories ?? 0),
      protein_g: acc.protein_g + Number(l.protein_g ?? 0),
      carbs_g: acc.carbs_g + Number(l.carbs_g ?? 0),
      fat_g: acc.fat_g + Number(l.fat_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );

  const mealOrder: Record<string, number> = {
    Breakfast: 0, Lunch: 1, Dinner: 2, Snack: 3, "Pre-workout": 4, "Post-workout": 5,
  };

  const sortedMeals = MEAL_TYPES.filter((type) =>
    todayLogs.some((l) => l.meal_type === type),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nutrition"
        description="Track your meals, hit your protein target, and understand your intake."
      >
        <MealForm />
      </PageHeader>

      {logs.length === 0 ? (
        <EmptyState
          icon={Utensils}
          title="No meals logged yet"
          description="Start tracking your nutrition. Log meals manually, track your macros, and stay on top of your protein target every day."
        >
          <MealForm />
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {/* Today's macro rings */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{todayTotals.calories} <span className="text-base font-normal text-muted-foreground">/ {DAILY_TARGETS.calories} kcal</span></p>
              </div>
              <MealForm
                trigger={
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                }
              />
            </div>
            <Progress value={Math.min(100, (todayTotals.calories / DAILY_TARGETS.calories) * 100)} className="h-2 mb-4" />
            <div className="grid grid-cols-3 gap-3">
              <MacroBar label="Protein" icon={Beef} value={todayTotals.protein_g} target={DAILY_TARGETS.protein_g} unit="g" color="text-orange-500" />
              <MacroBar label="Carbs" icon={Wheat} value={todayTotals.carbs_g} target={DAILY_TARGETS.carbs_g} unit="g" color="text-sky-500" />
              <MacroBar label="Fat" icon={Droplets} value={todayTotals.fat_g} target={DAILY_TARGETS.fat_g} unit="g" color="text-amber-500" />
            </div>
          </div>

          {/* Today's meals */}
          {todayLogs.length > 0 && (
            <section className="space-y-2">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Today&apos;s meals</h2>
              <div className="space-y-1.5">
                {sortedMeals.map((mealType) => {
                  const items = todayLogs.filter((l) => l.meal_type === mealType);
                  if (items.length === 0) return null;
                  const mealCals = items.reduce((s, l) => s + (l.calories ?? 0), 0);
                  return (
                    <div key={mealType} className="rounded-xl border bg-card px-4 py-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{mealType}</p>
                        <p className="text-xs font-medium">{mealCals} kcal</p>
                      </div>
                      <div className="space-y-1">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span>{item.name}</span>
                            <span className="text-muted-foreground tabular-nums">
                              {item.calories ? `${item.calories} kcal` : ""}
                              {item.protein_g ? ` · ${item.protein_g}g P` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function MacroBar({
  label,
  icon: Icon,
  value,
  target,
  unit,
  color,
}: {
  label: string;
  icon: typeof Beef;
  value: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <Progress value={pct} className="h-1.5" />
      <p className="text-xs font-medium">
        {Math.round(value)}<span className="text-muted-foreground">/{target}{unit}</span>
      </p>
    </div>
  );
}
