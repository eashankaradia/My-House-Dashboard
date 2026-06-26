"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn, formatDate } from "@/lib/utils";
import type { ActionResult } from "@/lib/action-utils";

export type CalEvent = {
  date: string; // yyyy-mm-dd
  title: string;
  type: keyof typeof TYPE_STYLES;
  href: string;
  /** Set for user-added calendar_events, so they can be deleted. */
  id?: string;
};

const TYPE_STYLES = {
  bill: "bg-sky-500",
  maintenance: "bg-amber-500",
  project: "bg-violet-500",
  document: "bg-rose-500",
  mortgage: "bg-emerald-500",
  savings: "bg-teal-500",
  task: "bg-indigo-500",
  event: "bg-fuchsia-500",
} as const;

const TYPE_LABEL: Record<string, string> = {
  bill: "Bill due",
  maintenance: "Maintenance",
  project: "Project target",
  document: "Renewal/expiry",
  mortgage: "Mortgage",
  savings: "Savings target",
  task: "Task",
  event: "Your event",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CalendarView({
  events,
  onAdd,
  onDelete,
}: {
  events: CalEvent[];
  onAdd: (input: { title: string; event_date: string; recurrence?: string; notes?: string | null }) => Promise<ActionResult>;
  onDelete: (id: string) => Promise<ActionResult>;
}) {
  const today = new Date();
  const [cursor, setCursor] = React.useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [legendType, setLegendType] = React.useState<keyof typeof TYPE_STYLES | null>(null);
  const todayKey = ymd(today);

  // For the legend dialog: every record of one type, split into upcoming/recent.
  const legendLists = React.useMemo(() => {
    if (!legendType) return { upcoming: [] as CalEvent[], recent: [] as CalEvent[] };
    const ofType = events.filter((e) => e.type === legendType);
    const upcoming = ofType
      .filter((e) => e.date >= todayKey)
      .sort((a, b) => a.date.localeCompare(b.date));
    const recent = ofType
      .filter((e) => e.date < todayKey)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20);
    return { upcoming, recent };
  }, [legendType, events, todayKey]);

  function pickDayFromLegend(date: string) {
    setLegendType(null);
    setSelectedDate(date);
  }

  const byDate = React.useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return map;
  }, [events]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first offset.
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells: (Date | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const monthEvents = events
    .filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {cursor.toLocaleString("en-GB", { month: "long", year: "numeric" })}
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSelectedDate(ymd(today))}>
                <Plus className="h-4 w-4" /> Event
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCursor(new Date(year, month - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>
                Today
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCursor(new Date(year, month + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="pb-1 text-center text-xs font-medium text-muted-foreground">
                {w}
              </div>
            ))}
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const key = ymd(d);
              const dayEvents = byDate.get(key) ?? [];
              const isToday = key === ymd(today);
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => setSelectedDate(key)}
                  className={cn(
                    "min-h-[64px] rounded-lg border p-1.5 text-left transition-colors hover:bg-accent",
                    isToday ? "border-primary bg-primary/5" : "border-border",
                  )}
                  aria-label={`View ${dayEvents.length} events on ${formatDate(key)}`}
                >
                  <div className={cn("text-xs", isToday ? "font-semibold text-primary" : "text-muted-foreground")}>
                    {d.getDate()}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dayEvents.slice(0, 4).map((e, j) => (
                      <span key={j} className={cn("h-1.5 w-1.5 rounded-full", TYPE_STYLES[e.type])} title={e.title} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            {Object.entries(TYPE_LABEL).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setLegendType(k as keyof typeof TYPE_STYLES)}
                className="flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:bg-accent hover:text-foreground"
                aria-label={`List all ${label} records`}
              >
                <span className={cn("h-2 w-2 rounded-full", TYPE_STYLES[k as keyof typeof TYPE_STYLES])} />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="mb-3 font-semibold">This month</h3>
          {monthEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No key dates this month.</p>
          ) : (
            <div className="space-y-2">
              {monthEvents.map((e, i) => {
                const rowClass = "flex items-center gap-2 rounded-lg border p-2 text-sm";
                const inner = (
                  <>
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", TYPE_STYLES[e.type])} />
                    <span className="min-w-0 flex-1 truncate">{e.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(e.date)}</span>
                  </>
                );
                return e.href ? (
                  <Link key={i} href={e.href} className={`${rowClass} transition-colors hover:bg-accent`}>
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedDate(e.date)}
                    className={`${rowClass} w-full text-left transition-colors hover:bg-accent`}
                  >
                    {inner}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedDate)} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedDate ? formatDate(selectedDate) : "Day details"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {selectedDate && (byDate.get(selectedDate) ?? []).length > 0 ? (
              (byDate.get(selectedDate) ?? []).map((event, index) =>
                event.type === "event" ? (
                  <div
                    key={`event-${event.id ?? index}`}
                    className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                  >
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", TYPE_STYLES.event)} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{event.title}</span>
                      <span className="text-xs text-muted-foreground">{TYPE_LABEL.event}</span>
                    </span>
                    {event.id ? <DeleteEventButton id={event.id} onDelete={onDelete} /> : null}
                  </div>
                ) : (
                  <Link
                    key={`${event.type}-${index}`}
                    href={event.href}
                    className="flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
                  >
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", TYPE_STYLES[event.type])} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{event.title}</span>
                      <span className="text-xs text-muted-foreground">{TYPE_LABEL[event.type]}</span>
                    </span>
                  </Link>
                ),
              )
            ) : (
              <p className="py-2 text-center text-sm text-muted-foreground">Nothing scheduled for this day.</p>
            )}
            {selectedDate ? <AddEventForm date={selectedDate} onAdd={onAdd} /> : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(legendType)} onOpenChange={(open) => !open && setLegendType(null)}>
        <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {legendType ? (
                <span className={cn("h-2.5 w-2.5 rounded-full", TYPE_STYLES[legendType])} />
              ) : null}
              {legendType ? TYPE_LABEL[legendType] : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <LegendGroup heading="Upcoming" events={legendLists.upcoming} emptyText="Nothing upcoming." onPickDay={pickDayFromLegend} />
            <LegendGroup heading="Recent" events={legendLists.recent} emptyText="Nothing recent." onPickDay={pickDayFromLegend} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LegendGroup({
  heading,
  events,
  emptyText,
  onPickDay,
}: {
  heading: string;
  events: CalEvent[];
  emptyText: string;
  onPickDay: (date: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{heading}</p>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {events.map((e, i) => {
            const rowClass = "flex items-center gap-2 rounded-lg border p-2 text-sm";
            const inner = (
              <>
                <span className={cn("h-2 w-2 shrink-0 rounded-full", TYPE_STYLES[e.type])} />
                <span className="min-w-0 flex-1 truncate">{e.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(e.date)}</span>
              </>
            );
            return e.href ? (
              <Link key={i} href={e.href} className={`${rowClass} transition-colors hover:bg-accent`}>
                {inner}
              </Link>
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => onPickDay(e.date)}
                className={`${rowClass} w-full text-left transition-colors hover:bg-accent`}
              >
                {inner}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeleteEventButton({ id, onDelete }: { id: string; onDelete: (id: string) => Promise<ActionResult> }) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Delete event"
      onClick={() =>
        startTransition(async () => {
          const res = await onDelete(id);
          if (res?.error) toast({ variant: "destructive", title: "Couldn't delete", description: res.error });
        })
      }
      className="shrink-0 text-muted-foreground hover:text-destructive"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

function AddEventForm({
  date,
  onAdd,
}: {
  date: string;
  onAdd: (input: { title: string; event_date: string; recurrence?: string; notes?: string | null }) => Promise<ActionResult>;
}) {
  const [title, setTitle] = React.useState("");
  const [recurrence, setRecurrence] = React.useState("none");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      const res = await onAdd({ title, event_date: date, recurrence });
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't add", description: res.error });
        return;
      }
      toast({ title: "Event added" });
      setTitle("");
      setRecurrence("none");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-lg border bg-card/40 p-2.5">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add an event…" className="h-9" />
      <div className="flex items-center gap-2">
        <NativeSelect value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className="h-9 flex-1 text-sm">
          <option value="none">One-off</option>
          <option value="weekly">Repeats weekly</option>
          <option value="monthly">Repeats monthly</option>
          <option value="yearly">Repeats yearly</option>
        </NativeSelect>
        <Button type="submit" size="sm" disabled={pending || !title.trim()} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </form>
  );
}
