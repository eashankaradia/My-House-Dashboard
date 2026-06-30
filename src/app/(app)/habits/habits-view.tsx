"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Flame, ChevronRight, Timer as TimerIcon, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Habit, HabitLog, HabitTarget } from "@/lib/database.types";
import { logHabit, unlogHabit } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { getStreak } from "@/lib/habit-progress";
import { HabitDetailDialog } from "./habit-detail-dialog";

type Props = {
  habits: Habit[];
  logs: HabitLog[];
  targets: HabitTarget[];
  completedToday: string[];
};

export function HabitsView({ habits, logs, targets, completedToday }: Props) {
  const [optimisticDone, setOptimisticDone] = useState<Set<string>>(new Set(completedToday));
  const [, startTransition] = useTransition();
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);
  const { toast } = useToast();

  const todayStr = new Date().toISOString().slice(0, 10);

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
      {daily.length > 0 && (
        <HabitGroup title="Daily" habits={daily} logs={logs} optimisticDone={optimisticDone} onToggle={toggle} onExpand={setDetailHabit} />
      )}
      {weekly.length > 0 && (
        <HabitGroup title="Weekly" habits={weekly} logs={logs} optimisticDone={optimisticDone} onToggle={toggle} onExpand={setDetailHabit} />
      )}
      {monthly.length > 0 && (
        <HabitGroup title="Monthly" habits={monthly} logs={logs} optimisticDone={optimisticDone} onToggle={toggle} onExpand={setDetailHabit} />
      )}

      <HabitDetailDialog
        habit={detailHabit}
        logs={logs}
        targets={targets}
        open={Boolean(detailHabit)}
        onOpenChange={(v) => !v && setDetailHabit(null)}
      />
    </div>
  );
}

function HabitGroup({
  title,
  habits,
  logs,
  optimisticDone,
  onToggle,
  onExpand,
}: {
  title: string;
  habits: Habit[];
  logs: HabitLog[];
  optimisticDone: Set<string>;
  onToggle: (h: Habit) => void;
  onExpand: (h: Habit) => void;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
      <div className="space-y-1.5">
        {habits.map((habit) => {
          const done = optimisticDone.has(habit.id);
          const streak = getStreak(habit, logs);
          const todayLog = logs.find((l) => l.habit_id === habit.id && l.logged_date === todayStr);

          return (
            <div
              key={habit.id}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3.5 text-left transition-all",
                done && "border-primary/20 bg-primary/5",
              )}
            >
              {habit.habit_type === "yes_no" ? (
                <button onClick={() => onToggle(habit)} className="shrink-0 active:scale-90 transition-transform">
                  {done ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                </button>
              ) : habit.habit_type === "timer" ? (
                <TimerIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
              ) : (
                <Hash className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}

              <button onClick={() => onExpand(habit)} className="min-w-0 flex-1 text-left">
                <p className={cn("font-medium", done && habit.habit_type === "yes_no" && "line-through text-muted-foreground")}>
                  {habit.name}
                </p>
                {habit.habit_type === "numeric" && todayLog?.value != null ? (
                  <p className="text-xs text-muted-foreground">
                    {todayLog.value} {habit.unit ?? ""} today
                  </p>
                ) : habit.habit_type === "timer" && todayLog?.duration_seconds ? (
                  <p className="text-xs text-muted-foreground">{Math.round(todayLog.duration_seconds / 60)} min today</p>
                ) : habit.description ? (
                  <p className="text-xs text-muted-foreground">{habit.description}</p>
                ) : null}
              </button>

              {streak > 0 && (
                <Badge variant="secondary" className="gap-1 shrink-0">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {streak}
                </Badge>
              )}
              <button onClick={() => onExpand(habit)} className="shrink-0 text-muted-foreground">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
