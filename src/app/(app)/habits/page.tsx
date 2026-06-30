import { Repeat, Plus, Flame, CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { Habit, HabitLog } from "@/lib/database.types";
import { HabitsView } from "./habits-view";

export const metadata = { title: "Habits" };

export default async function HabitsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const todayStr = new Date().toISOString().slice(0, 10);

  const [habitsRes, logsRes] = await Promise.all([
    supabase
      .from("habits")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("habit_logs")
      .select("*")
      .gte("logged_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
      .order("logged_date", { ascending: false }),
  ]);

  const habits = (habitsRes.data ?? []) as Habit[];
  const logs = (logsRes.data ?? []) as HabitLog[];

  const completedToday = logs.filter((l) => l.logged_date === todayStr).map((l) => l.habit_id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Habits"
        description="Build consistency one day at a time."
        info="Track daily, weekly, and monthly habits. Your streak grows as you stay consistent."
      >
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add habit
        </Button>
      </PageHeader>

      {habits.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No habits yet"
          description="Add your first habit and start building streaks. Whether it's daily exercise, reading, or drinking more water — small habits compound into big results."
        >
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add your first habit
          </Button>
        </EmptyState>
      ) : (
        <>
          {/* Today summary strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">Done today</span>
              </div>
              <p className="mt-1.5 text-2xl font-bold">
                {completedToday.length}
                <span className="text-base font-normal text-muted-foreground">/{habits.filter((h) => h.frequency === "daily").length}</span>
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flame className="h-4 w-4" />
                <span className="text-xs font-medium">Best streak</span>
              </div>
              <p className="mt-1.5 text-2xl font-bold">—</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">This week</span>
              </div>
              <p className="mt-1.5 text-2xl font-bold">—</p>
            </div>
          </div>

          <HabitsView habits={habits} logs={logs} completedToday={completedToday} userId={user?.id ?? ""} />
        </>
      )}
    </div>
  );
}
