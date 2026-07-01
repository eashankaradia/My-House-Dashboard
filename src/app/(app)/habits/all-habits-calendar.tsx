"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Habit, HabitLog } from "@/lib/database.types";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** A month-grid heatmap across every daily habit — how much of the day's habits got done. */
export function AllHabitsCalendar({ habits, logs }: { habits: Habit[]; logs: HabitLog[] }) {
  const [cursor, setCursor] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const dailyHabits = React.useMemo(() => habits.filter((h) => h.frequency === "daily"), [habits]);

  const doneByDate = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const l of logs) {
      if (!map.has(l.logged_date)) map.set(l.logged_date, new Set());
      map.get(l.logged_date)!.add(l.habit_id);
    }
    return map;
  }, [logs]);

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
    <div className="space-y-2 rounded-xl border bg-card p-4">
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
          const doneIds = doneByDate.get(dateStr) ?? new Set<string>();
          const doneNames = dailyHabits.filter((h) => doneIds.has(h.id)).map((h) => h.name);
          const pct = dailyHabits.length > 0 ? doneNames.length / dailyHabits.length : 0;
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;
          return (
            <div
              key={dateStr}
              title={doneNames.length > 0 ? doneNames.join(", ") : undefined}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md text-[11px]",
                isFuture
                  ? "bg-muted/20 text-muted-foreground/50"
                  : pct === 0
                    ? "bg-muted/50 text-muted-foreground"
                    : pct < 0.5
                      ? "bg-primary/25 text-foreground"
                      : pct < 1
                        ? "bg-primary/60 text-primary-foreground"
                        : "bg-primary font-semibold text-primary-foreground",
                isToday && "ring-2 ring-primary/50",
              )}
            >
              {Number(dateStr.slice(-2))}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        <span className="h-3 w-3 rounded-sm bg-muted/50" />
        <span className="h-3 w-3 rounded-sm bg-primary/25" />
        <span className="h-3 w-3 rounded-sm bg-primary/60" />
        <span className="h-3 w-3 rounded-sm bg-primary" />
        <span>More</span>
      </div>
    </div>
  );
}
