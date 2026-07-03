import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, toMonthly } from "@/lib/utils";
import { monthStr as financeMonthStr, effectiveIncomeForMonth } from "@/lib/income";
import { weekStart, monthStart, weekLabel, monthLabel } from "@/lib/review-periods";
import type { Bill, Goal, Habit, HabitLog, IncomeMonth, MaintenanceTask, ProjectTask, Review } from "@/lib/database.types";
import { ReviewsView } from "./reviews-view";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const supabase = await createClient();

  const now = new Date();
  const thisWeekStart = weekStart(now);
  const thisMonthStart = monthStart(now);
  const thirtyDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [tasksRes, habitsRes, habitLogsRes, goalsRes, billsRes, incomeMonthsRes, maintenanceRes, reviewsRes] = await Promise.all([
    supabase.from("project_tasks").select("*").is("archived_at", null),
    supabase.from("habits").select("*").eq("is_active", true).eq("frequency", "daily"),
    supabase.from("habit_logs").select("*").gte("logged_date", thirtyDaysAgo),
    supabase.from("goals").select("*").eq("status", "Active"),
    supabase.from("bills").select("*"),
    supabase.from("income_months").select("*").order("month", { ascending: false }),
    supabase.from("maintenance_tasks").select("*"),
    supabase.from("reviews").select("*").order("period_start", { ascending: false }),
  ]);

  const tasks = (tasksRes.data ?? []) as ProjectTask[];
  const dailyHabits = (habitsRes.data ?? []) as Habit[];
  const habitLogs = (habitLogsRes.data ?? []) as HabitLog[];
  const activeGoals = (goalsRes.data ?? []) as Goal[];
  const bills = (billsRes.data ?? []) as Bill[];
  const incomeMonths = (incomeMonthsRes.data ?? []) as IncomeMonth[];
  const maintenance = (maintenanceRes.data ?? []) as MaintenanceTask[];
  const reviews = (reviewsRes.data ?? []) as Review[];

  const weeklyReviews = reviews.filter((r) => r.period_type === "weekly");
  const monthlyReviews = reviews.filter((r) => r.period_type === "monthly");
  const currentWeekly = weeklyReviews.find((r) => r.period_start === thisWeekStart);
  const currentMonthly = monthlyReviews.find((r) => r.period_start === thisMonthStart);

  // --- Weekly rollup: what's overdue/due, and how habits went this week ------
  const overdueTasks = tasks.filter((t) => !t.is_done && t.due_date && t.due_date < now.toISOString().slice(0, 10)).length;
  const dueThisWeek = tasks.filter((t) => {
    if (t.is_done || !t.due_date) return false;
    const weekEnd = new Date(`${thisWeekStart}T00:00:00`);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return t.due_date >= thisWeekStart && t.due_date <= weekEnd.toISOString().slice(0, 10);
  }).length;
  const weekLogs = habitLogs.filter((l) => l.logged_date >= thisWeekStart);
  const daysThisWeekSoFar = Math.min(7, Math.floor((now.getTime() - new Date(`${thisWeekStart}T00:00:00`).getTime()) / 86400000) + 1);
  const weeklyHabitPct =
    dailyHabits.length > 0 && daysThisWeekSoFar > 0
      ? Math.round((weekLogs.length / (dailyHabits.length * daysThisWeekSoFar)) * 100)
      : null;

  // --- Monthly rollup: money, fitness, goals, home ----------------------------
  const thisMonth = financeMonthStr(now);
  const income = effectiveIncomeForMonth(incomeMonths, thisMonth);
  const monthlyIncome = income.source !== "none" ? income.net + income.bonus : null;
  const monthlyBills = bills.reduce((s, b) => s + toMonthly(Number(b.amount), b.frequency), 0);
  const netMonthly = monthlyIncome !== null ? monthlyIncome - monthlyBills : null;

  const monthLogs = habitLogs.filter((l) => l.logged_date >= thisMonthStart);
  const daysThisMonthSoFar = now.getDate();
  const monthlyHabitPct =
    dailyHabits.length > 0 && daysThisMonthSoFar > 0
      ? Math.round((monthLogs.length / (dailyHabits.length * daysThisMonthSoFar)) * 100)
      : null;

  const avgGoalProgress =
    activeGoals.length > 0
      ? Math.round(
          activeGoals.reduce((s, g) => {
            if (!g.target_value || !g.current_value) return s;
            return s + Math.min(100, (Number(g.current_value) / Number(g.target_value)) * 100);
          }, 0) / activeGoals.length,
        )
      : null;

  const maintenanceCompletedThisMonth = maintenance.filter(
    (m) => m.last_completed_date && m.last_completed_date >= thisMonthStart,
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="A regular check-in: what's working, what's stuck, and what matters next."
        info="Weekly reviews look at tasks and habits. Monthly reviews roll up money, fitness, goals and home. Both save one entry per period — come back and edit it any time during that week/month."
      />

      <ReviewsView
        weekLabel={weekLabel(thisWeekStart)}
        monthLabel={monthLabel(thisMonthStart)}
        thisWeekStart={thisWeekStart}
        thisMonthStart={thisMonthStart}
        currentWeekly={currentWeekly}
        currentMonthly={currentMonthly}
        weeklyReviews={weeklyReviews}
        monthlyReviews={monthlyReviews}
        weeklyStats={
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Overdue tasks" value={String(overdueTasks)} accent={overdueTasks > 0 ? "destructive" : "muted"} icon={ClipboardCheck} />
            <StatCard label="Due this week" value={String(dueThisWeek)} accent="muted" />
            <StatCard label="Habits this week" value={weeklyHabitPct !== null ? `${weeklyHabitPct}%` : "—"} accent="muted" />
          </div>
        }
        monthlyStats={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Net this month" value={netMonthly !== null ? formatCurrency(netMonthly) : "—"} accent={netMonthly !== null && netMonthly < 0 ? "destructive" : "muted"} />
            <StatCard label="Habits this month" value={monthlyHabitPct !== null ? `${monthlyHabitPct}%` : "—"} accent="muted" />
            <StatCard label="Avg goal progress" value={avgGoalProgress !== null ? `${avgGoalProgress}%` : "—"} accent="muted" />
            <StatCard label="Home tasks done" value={String(maintenanceCompletedThisMonth)} accent="muted" />
          </div>
        }
      />
    </div>
  );
}
