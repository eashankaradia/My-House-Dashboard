import { Repeat, Flame, CheckCircle2, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { Habit, HabitLog, HabitTarget } from "@/lib/database.types";
import { getStreak, sumForPeriod } from "@/lib/habit-progress";
import { HabitsView } from "./habits-view";
import { HabitForm } from "./habit-form";

export const metadata = { title: "Habits" };

export default async function HabitsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const todayStr = new Date().toISOString().slice(0, 10);

  const [habitsRes, logsRes, targetsRes] = await Promise.all([
    supabase
      .from("habits")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    supabase.from("habit_logs").select("*").order("logged_date", { ascending: false }),
    supabase.from("habit_targets").select("*"),
  ]);

  const habits = (habitsRes.data ?? []) as Habit[];
  const logs = (logsRes.data ?? []) as HabitLog[];
  const targets = (targetsRes.data ?? []) as HabitTarget[];

  const completedToday = logs.filter((l) => l.logged_date === todayStr).map((l) => l.habit_id);
  const dailyHabits = habits.filter((h) => h.frequency === "daily");
  const bestStreak = habits.reduce((max, h) => Math.max(max, getStreak(h, logs)), 0);
  const thisWeek = habits.reduce((sum, h) => sum + sumForPeriod(h, logs, "week", new Date()), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Habits"
        description="Build consistency one day at a time."
        info="Track yes/no, numeric, and timer habits. Set targets per day, week, month, year, or an all-time goal."
      >
        <HabitForm />
      </PageHeader>

      {habits.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No habits yet"
          description="Add your first habit and start building streaks. Whether it's daily exercise, reading, or drinking more water — small habits compound into big results."
        >
          <HabitForm />
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
                <span className="text-base font-normal text-muted-foreground">/{dailyHabits.length}</span>
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flame className="h-4 w-4" />
                <span className="text-xs font-medium">Best streak</span>
              </div>
              <p className="mt-1.5 text-2xl font-bold">{bestStreak}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">This week</span>
              </div>
              <p className="mt-1.5 text-2xl font-bold">{Math.round(thisWeek)}</p>
            </div>
          </div>

          <HabitsView habits={habits} logs={logs} targets={targets} completedToday={completedToday} />
        </>
      )}
    </div>
  );
}
