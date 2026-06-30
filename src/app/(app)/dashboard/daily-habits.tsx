"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Habit, HabitLog } from "@/lib/database.types";
import { logHabit, unlogHabit } from "@/app/(app)/habits/actions";
import { useToast } from "@/hooks/use-toast";

type Props = {
  habits: Habit[];
  logs: HabitLog[];
  completedToday: string[];
};

export function DailyHabits({ habits, logs, completedToday }: Props) {
  const [optimisticDone, setOptimisticDone] = useState<Set<string>>(new Set(completedToday));
  const [, startTransition] = useTransition();
  const { toast } = useToast();
  const todayStr = new Date().toISOString().slice(0, 10);

  function getStreak(habitId: string): number {
    const habitLogs = logs
      .filter((l) => l.habit_id === habitId)
      .map((l) => l.logged_date)
      .sort()
      .reverse();
    if (habitLogs.length === 0) return 0;
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const dateStr = cursor.toISOString().slice(0, 10);
      if (habitLogs.includes(dateStr)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (i === 0) {
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  function toggle(habit: Habit) {
    const isDone = optimisticDone.has(habit.id);
    startTransition(async () => {
      const next = new Set(optimisticDone);
      if (isDone) {
        next.delete(habit.id);
        setOptimisticDone(next);
        const result = await unlogHabit(habit.id, todayStr);
        if (result?.error) {
          next.add(habit.id);
          setOptimisticDone(next);
          toast({ title: result.error, variant: "destructive" });
        }
      } else {
        next.add(habit.id);
        setOptimisticDone(next);
        const result = await logHabit(habit.id, todayStr);
        if (result?.error) {
          next.delete(habit.id);
          setOptimisticDone(next);
          toast({ title: result.error, variant: "destructive" });
        }
      }
    });
  }

  const daily = habits.filter((h) => h.frequency === "daily");
  if (daily.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {daily.map((habit) => {
        const done = optimisticDone.has(habit.id);
        const streak = getStreak(habit.id);
        return (
          <button
            key={habit.id}
            onClick={() => toggle(habit)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left text-sm transition-all active:scale-[0.99]",
              done && "border-primary/20 bg-primary/5",
            )}
          >
            {done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className={cn("min-w-0 flex-1 truncate font-medium", done && "line-through text-muted-foreground")}>
              {habit.name}
            </span>
            {streak > 1 && (
              <span className="flex shrink-0 items-center gap-0.5 text-xs text-orange-500">
                <Flame className="h-3 w-3" />
                {streak}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
