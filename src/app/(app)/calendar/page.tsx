import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import type {
  Bill,
  CalendarEvent,
  Document,
  MaintenanceTask,
  Mortgage,
  Project,
  ProjectTask,
  SavingsPot,
} from "@/lib/database.types";
import { CalendarView, type CalEvent } from "./calendar-view";
import { createCalendarEvent, deleteCalendarEvent } from "./actions";

export const metadata = { title: "Calendar" };

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Expand a (maybe recurring) event into the dates that fall in the window. */
function expandRecurring(ev: CalendarEvent, start: Date, end: Date): string[] {
  const out: string[] = [];
  const cur = new Date(`${ev.event_date}T00:00:00`);
  const advance = () => {
    if (ev.recurrence === "weekly") cur.setDate(cur.getDate() + 7);
    else if (ev.recurrence === "monthly") cur.setMonth(cur.getMonth() + 1);
    else if (ev.recurrence === "yearly") cur.setFullYear(cur.getFullYear() + 1);
  };
  if (ev.recurrence === "none") {
    if (cur >= start && cur <= end) out.push(ymd(cur));
    return out;
  }
  let guard = 0;
  while (cur < start && guard < 5000) {
    advance();
    guard += 1;
  }
  guard = 0;
  while (cur <= end && guard < 1000) {
    out.push(ymd(cur));
    advance();
    guard += 1;
  }
  return out;
}

export default async function CalendarPage() {
  const supabase = await createClient();
  const [bills, maint, projects, docs, mortgages, pots, tasks, calEvents] = await Promise.all([
    supabase.from("bills").select("*"),
    supabase.from("maintenance_tasks").select("*"),
    supabase.from("projects").select("*"),
    supabase.from("documents").select("*"),
    supabase.from("mortgages").select("*"),
    supabase.from("savings_pots").select("*"),
    supabase.from("project_tasks").select("*"),
    supabase.from("calendar_events").select("*"),
  ]);

  const events: CalEvent[] = [];

  for (const b of (bills.data ?? []) as Bill[]) {
    if (b.due_date) events.push({ date: b.due_date, title: `${b.name} due`, type: "bill", href: `/bills?item=${b.id}` });
  }
  for (const m of (maint.data ?? []) as MaintenanceTask[]) {
    if (m.next_due_date)
      events.push({ date: m.next_due_date, title: m.task, type: "maintenance", href: `/maintenance?item=${m.id}` });
  }
  for (const p of (projects.data ?? []) as Project[]) {
    if (p.archived_at) continue;
    if (p.target_completion_date)
      events.push({ date: p.target_completion_date, title: `${p.name} target`, type: "project", href: `/projects?project=${p.id}` });
  }
  for (const d of (docs.data ?? []) as Document[]) {
    if (d.expiry_date)
      events.push({ date: d.expiry_date, title: `${d.name} expires`, type: "document", href: `/documents?item=${d.id}` });
  }
  for (const mo of (mortgages.data ?? []) as Mortgage[]) {
    if (mo.fixed_term_end_date)
      events.push({ date: mo.fixed_term_end_date, title: "Mortgage fixed term ends", type: "mortgage", href: "/mortgage" });
  }
  for (const pot of (pots.data ?? []) as SavingsPot[]) {
    if (pot.target_date)
      events.push({ date: pot.target_date, title: `${pot.name} target`, type: "savings", href: `/savings?item=${pot.id}` });
  }
  for (const t of (tasks.data ?? []) as ProjectTask[]) {
    if (t.archived_at) continue;
    if (t.due_date && !t.is_done)
      events.push({ date: t.due_date, title: t.title, type: "task", href: `/projects?task=${t.id}` });
  }

  // User-added events, expanded across a window around today so recurring ones
  // show on every occurrence the user can navigate to.
  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const windowEnd = new Date(now.getFullYear(), now.getMonth() + 18, 0);
  for (const ev of (calEvents.data ?? []) as CalendarEvent[]) {
    for (const date of expandRecurring(ev, windowStart, windowEnd)) {
      events.push({ date, title: ev.title, type: "event", href: "", id: ev.id });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Every key date across your home in one view."
        info="Shows your own events plus bill due dates, maintenance, project targets, document renewals, your mortgage fixed-term end and savings targets. Click a day to see details or add an event. Use Export to download an .ics file you can import into Gmail, Apple Calendar or Outlook."
      >
        <a
          href="/api/calendar"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-accent"
        >
          <Download className="h-4 w-4" /> Export to email/calendar
        </a>
      </PageHeader>
      <CalendarView events={events} onAdd={createCalendarEvent} onDelete={deleteCalendarEvent} />
    </div>
  );
}
