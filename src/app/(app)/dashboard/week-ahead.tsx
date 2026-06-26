import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type WeekDay = { key: string; dayNum: number; weekday: string; isToday: boolean; count: number };

/** A compact strip of the next 7 days with a badge for how much is on each. */
export function WeekAhead({ days }: { days: WeekDay[] }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">Week ahead</p>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => (
            <Link
              key={d.key}
              href="/calendar"
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center transition-colors hover:bg-accent",
                d.isToday ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              <span className="text-[10px] uppercase text-muted-foreground">{d.weekday}</span>
              <span className={cn("text-sm font-semibold", d.isToday && "text-primary")}>{d.dayNum}</span>
              {d.count > 0 ? (
                <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-medium text-primary">{d.count}</span>
              ) : (
                <span className="h-[14px]" />
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
