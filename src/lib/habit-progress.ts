import type { Habit, HabitLog } from "@/lib/database.types";

/** A logged amount for one day: 1 for yes/no, the numeric value, or minutes for a timer. */
export function logAmount(habit: Habit, log: HabitLog): number {
  if (habit.habit_type === "timer") return (log.duration_seconds ?? 0) / 60;
  if (habit.habit_type === "numeric") return log.value ?? 0;
  return 1;
}

export function getStreak(habit: Habit, logs: HabitLog[]): number {
  const days = new Set(logs.filter((l) => l.habit_id === habit.id).map((l) => l.logged_date));
  if (days.size === 0) return 0;
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < 3650; i++) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (days.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      // Today not logged yet doesn't break a streak built on prior days.
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  const day = out.getDay(); // 0 = Sunday
  out.setDate(out.getDate() - day);
  out.setHours(0, 0, 0, 0);
  return out;
}

/** Sum of logged amounts for a habit within the given target period, relative to today. */
export function sumForPeriod(habit: Habit, logs: HabitLog[], period: string, today = new Date()): number {
  const habitLogs = logs.filter((l) => l.habit_id === habit.id);
  if (period === "all_time" || period === "single") {
    return habitLogs.reduce((sum, l) => sum + logAmount(habit, l), 0);
  }
  if (period === "day") {
    const todayStr = today.toISOString().slice(0, 10);
    return habitLogs.filter((l) => l.logged_date === todayStr).reduce((sum, l) => sum + logAmount(habit, l), 0);
  }
  if (period === "week") {
    const start = startOfWeek(today);
    const startStr = start.toISOString().slice(0, 10);
    return habitLogs.filter((l) => l.logged_date >= startStr).reduce((sum, l) => sum + logAmount(habit, l), 0);
  }
  if (period === "month") {
    const prefix = today.toISOString().slice(0, 7); // YYYY-MM
    return habitLogs.filter((l) => l.logged_date.startsWith(prefix)).reduce((sum, l) => sum + logAmount(habit, l), 0);
  }
  if (period === "year") {
    const prefix = today.toISOString().slice(0, 4); // YYYY
    return habitLogs.filter((l) => l.logged_date.startsWith(prefix)).reduce((sum, l) => sum + logAmount(habit, l), 0);
  }
  return 0;
}
