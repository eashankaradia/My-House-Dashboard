"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type WeekDayItem = { label: string; sub: string; href: string };
export type WeekDay = {
  key: string;
  dayNum: number;
  weekday: string;
  isToday: boolean;
  count: number;
  items: WeekDayItem[];
};

/**
 * A compact strip of the next 7 days with a badge for how much is on each.
 * Tapping a day expands its items inline rather than navigating away.
 */
export function WeekAhead({ days }: { days: WeekDay[] }) {
  const [openKey, setOpenKey] = React.useState<string | null>(null);
  const openDay = days.find((d) => d.key === openKey) ?? null;

  return (
    <Card>
      <CardContent className="p-3">
        <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">Week ahead</p>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const isOpen = d.key === openKey;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setOpenKey(isOpen ? null : d.key)}
                aria-expanded={isOpen}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center transition-colors hover:bg-accent",
                  isOpen ? "border-primary bg-primary/10" : d.isToday ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <span className="text-[10px] uppercase text-muted-foreground">{d.weekday}</span>
                <span className={cn("text-sm font-semibold", d.isToday && "text-primary")}>{d.dayNum}</span>
                {d.count > 0 ? (
                  <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-medium text-primary">{d.count}</span>
                ) : (
                  <span className="h-[14px]" />
                )}
              </button>
            );
          })}
        </div>

        {openDay ? (
          <div className="mt-3 space-y-1 border-t pt-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-medium text-muted-foreground">
                {openDay.weekday} {openDay.dayNum}
                {openDay.isToday ? " · Today" : ""}
              </p>
              <Link href="/calendar" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                Calendar <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {openDay.items.length === 0 ? (
              <p className="px-1 py-2 text-sm text-muted-foreground">Nothing on this day.</p>
            ) : (
              openDay.items.map((it, i) => (
                <Link
                  key={i}
                  href={it.href}
                  className="-mx-1 flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                >
                  <span className="min-w-0 truncate">{it.label}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{it.sub}</span>
                </Link>
              ))
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
