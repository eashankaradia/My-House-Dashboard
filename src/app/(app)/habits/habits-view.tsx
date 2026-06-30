"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Habit, HabitLog } from "@/lib/database.types";
import { logHabit, unlogHabit } from "./actions";
import { useToast } from "@/hooks/use-toast";

type Props = {
  habits: Habit[];
  logs: HabitLog[];
  completedToday: string[];
  userId: string;
};

export function HabitsView({ habits, logs, completedToday, userId }: Props) {
  const [optimisticDone, setOptimisticDone] = useState<Set<string>>(new Set(completedToday));
  const [isPending, startTransition] = useTransition();
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
        // Today hasn't been logged yet — don't break streak
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
  const weekly = habits.filter((h) => h.frequency === "weekly");
  const monthly = habits.filter((h) => h.frequency === "monthly");

  return (
    <div className="space-y-6">
      {daily.length > 0 && <HabitGroup title="Daily" habits={daily} optimisticDone={optimisticDone} getStreak={getStreak} onToggle={toggle} />}
      {weekly.length > 0 && <HabitGroup title="Weekly" habits={weekly} optimisticDone={optimisticDone} getStreak={getStreak} onToggle={toggle} />}
      {monthly.length > 0 && <HabitGroup title="Monthly" habits={monthly} optimisticDone={optimisticDone} getStreak={getStreak} onToggle={toggle} />}
    </div>
  );
}

function HabitGroup({
  title,
  habits,
  optimisticDone,
  getStreak,
  onToggle,
}: {
  title: string;
  habits: Habit[];
  optimisticDone: Set<string>;
  getStreak: (id: string) => number;
  onToggle: (h: Habit) => void;
}) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
      <div className="space-y-1.5">
        {habits.map((habit) => {
          const done = optimisticDone.has(habit.id);
          const streak = getStreak(habit.id);
          return (
            <button
              key={habit.id}
              onClick={() => onToggle(habit)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3.5 text-left transition-all active:scale-[0.99]",
                done && "border-primary/20 bg-primary/5",
              )}
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className={cn("font-medium", done && "line-through text-muted-foreground")}>{habit.name}</p>
                {habit.description && (
                  <p className="text-xs text-muted-foreground">{habit.description}</p>
                )}
              </div>
              {streak > 0 && (
                <Badge variant="secondary" className="gap-1 shrink-0">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {streak}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
