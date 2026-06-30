import { Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/server";
import type { Goal } from "@/lib/database.types";
import { formatCurrency } from "@/lib/utils";
import { GoalForm } from "./goal-form";

export const metadata = { title: "Goals" };

const CATEGORY_COLORS: Record<string, string> = {
  Financial: "text-emerald-500",
  Fitness:   "text-orange-500",
  Health:    "text-rose-500",
  Career:    "text-blue-500",
  Personal:  "text-violet-500",
  Home:      "text-amber-500",
  Learning:  "text-sky-500",
  Travel:    "text-teal-500",
};

export default async function GoalsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("goals")
    .select("*")
    .neq("status", "Abandoned")
    .order("created_at", { ascending: false });

  const goals = (data ?? []) as Goal[];
  const active = goals.filter((g) => g.status === "Active");
  const completed = goals.filter((g) => g.status === "Completed");
  const paused = goals.filter((g) => g.status === "Paused");

  function progress(g: Goal): number {
    if (!g.target_value || !g.current_value) return 0;
    return Math.min(100, Math.round((Number(g.current_value) / Number(g.target_value)) * 100));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals"
        description="Set meaningful goals and track your progress automatically."
        info="Goals calculate progress from linked data when possible, or you can update them manually."
      >
        <GoalForm />
      </PageHeader>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Set your first goal — financial, fitness, career, or personal. Goals give you direction and help you measure what matters."
        >
          <GoalForm />
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <GoalGroup
              title="Active"
              goals={active}
              progress={progress}
              categoryColors={CATEGORY_COLORS}
            />
          )}
          {completed.length > 0 && (
            <GoalGroup
              title="Completed"
              goals={completed}
              progress={progress}
              categoryColors={CATEGORY_COLORS}
            />
          )}
          {paused.length > 0 && (
            <GoalGroup
              title="Paused"
              goals={paused}
              progress={progress}
              categoryColors={CATEGORY_COLORS}
            />
          )}
        </div>
      )}
    </div>
  );
}

function GoalGroup({
  title,
  goals,
  progress,
  categoryColors,
}: {
  title: string;
  goals: Goal[];
  progress: (g: Goal) => number;
  categoryColors: Record<string, string>;
}) {
  return (
    <section className="space-y-3">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title} · {goals.length}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {goals.map((goal) => {
          const pct = progress(goal);
          const colorClass = categoryColors[goal.category] ?? "text-primary";
          return (
            <div key={goal.id} className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">{goal.title}</p>
                  {goal.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
                  )}
                </div>
                <Badge variant="secondary" className={`shrink-0 text-xs ${colorClass}`}>
                  {goal.category}
                </Badge>
              </div>

              {goal.target_value && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {goal.unit === "£" ? formatCurrency(Number(goal.current_value)) : `${goal.current_value ?? 0} ${goal.unit ?? ""}`}
                    </span>
                    <span>
                      {goal.unit === "£" ? formatCurrency(Number(goal.target_value)) : `${goal.target_value} ${goal.unit ?? ""}`}
                    </span>
                  </div>
                </div>
              )}

              {goal.target_date && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Target: {new Date(goal.target_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
