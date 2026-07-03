"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Habit, HabitLog } from "@/lib/database.types";
import { logAmount } from "@/lib/habit-progress";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** A month-grid calendar showing this habit's logged days/values. */
export function HabitCalendar({ habit, logs }: { habit: Habit; logs: HabitLog[] }) {
  const [cursor, setCursor] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const byDate = React.useMemo(() => {
    const map = new Map<string, HabitLog>();
    for (const l of logs) {
      if (l.habit_id === habit.id) map.set(l.logged_date, l);
    }
    return map;
  }, [logs, habit.id]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  const cells: (string | null)[] = [...Array(firstDay).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCursor(new Date(year, month - 1, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-medium">{cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCursor(new Date(year, month + 1, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
        {WEEKDAYS.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={i} />;
          const log = byDate.get(dateStr);
          const done = Boolean(log);
          const amount = log ? logAmount(habit, log) : 0;
          const isToday = dateStr === todayStr;
          return (
            <div
              key={dateStr}
              title={done ? `${amount}${habit.unit ? ` ${habit.unit}` : ""}` : undefined}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md text-[11px]",
                done ? "bg-primary text-primary-foreground font-semibold" : "bg-muted/50 text-muted-foreground",
                isToday && "ring-2 ring-primary/50",
              )}
            >
              {Number(dateStr.slice(-2))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
