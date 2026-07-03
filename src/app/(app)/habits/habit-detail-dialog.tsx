"use client";

import * as React from "react";
import { Quote, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import type { Habit, HabitLog, HabitTarget } from "@/lib/database.types";
import { HABIT_TARGET_PERIOD_LABELS } from "@/lib/constants";
import { sumForPeriod } from "@/lib/habit-progress";
import { HabitCalendar } from "./habit-calendar";
import { HabitTimer } from "./habit-timer";
import { HabitForm } from "./habit-form";
import { logHabitValue } from "./actions";
import { useToast } from "@/hooks/use-toast";

type Props = {
  habit: Habit | null;
  logs: HabitLog[];
  targets: HabitTarget[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HabitDetailDialog({ habit, logs, targets, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const [value, setValue] = React.useState("");

  if (!habit) return null;

  const habitTargets = targets.filter((t) => t.habit_id === habit.id);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLog = logs.find((l) => l.habit_id === habit.id && l.logged_date === todayStr);

  function logValue() {
    const num = Number(value);
    if (!num && num !== 0) return;
    startTransition(async () => {
      const r = await logHabitValue(habit!.id, todayStr, num);
      if (r?.error) {
        toast({ variant: "destructive", title: "Couldn't log", description: r.error });
        return;
      }
      toast({ title: "Logged" });
      setValue("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="flex-row items-center justify-between space-y-0 pr-8">
          <DialogTitle>{habit.name}</DialogTitle>
          <HabitForm
            habit={habit}
            targets={targets.filter((t) => t.habit_id === habit.id)}
            trigger={
              <Button variant="ghost" size="sm" className="shrink-0 gap-1.5 text-muted-foreground">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            }
          />
        </DialogHeader>
        <div className="space-y-4">
          {habit.why && (
            <div className="flex gap-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              <Quote className="h-4 w-4 shrink-0 text-primary" />
              <p>{habit.why}</p>
            </div>
          )}

          {habit.habit_type === "timer" && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Log time</p>
              <HabitTimer habitId={habit.id} />
            </div>
          )}

          {habit.habit_type === "numeric" && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Log today&apos;s value</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder={todayLog?.value != null ? String(todayLog.value) : `0 ${habit.unit ?? ""}`}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
                <Button type="button" disabled={pending || !value} onClick={logValue}>
                  Log
                </Button>
              </div>
            </div>
          )}

          {habitTargets.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Targets</p>
              {habitTargets.map((t) => {
                const current = sumForPeriod(habit, logs, t.period);
                const pct = Math.min(100, Math.round((current / t.target_value) * 100));
                return (
                  <div key={t.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{HABIT_TARGET_PERIOD_LABELS[t.period] ?? t.period}</span>
                      <span className="font-medium">
                        {current}
                        {habit.unit ? ` ${habit.unit}` : ""} / {t.target_value}
                        {habit.unit ? ` ${habit.unit}` : ""}
                      </span>
                    </div>
                    <Progress value={pct} />
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">History</p>
            <HabitCalendar habit={habit} logs={logs} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
