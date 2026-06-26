import { createClient } from "@/lib/supabase/server";
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

export const dynamic = "force-dynamic";

type Entry = { uid: string; date: string; title: string; rrule?: string };

const BILL_RRULE: Record<string, string> = {
  weekly: "FREQ=WEEKLY",
  monthly: "FREQ=MONTHLY",
  quarterly: "FREQ=MONTHLY;INTERVAL=3",
  annually: "FREQ=YEARLY",
};
const EVENT_RRULE: Record<string, string> = {
  weekly: "FREQ=WEEKLY",
  monthly: "FREQ=MONTHLY",
  yearly: "FREQ=YEARLY",
};

function compact(date: string): string {
  return date.replace(/-/g, "");
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/**
 * Authenticated iCalendar export of every key date in the home — import it into
 * Gmail / Apple Calendar / Outlook. (A live subscribe feed would need a public,
 * token-protected endpoint and a service-role key; not enabled here.)
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

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

  const entries: Entry[] = [];

  for (const b of (bills.data ?? []) as Bill[]) {
    if (b.due_date) entries.push({ uid: `bill-${b.id}`, date: b.due_date, title: `${b.name} due`, rrule: BILL_RRULE[b.frequency] });
  }
  for (const m of (maint.data ?? []) as MaintenanceTask[]) {
    if (m.next_due_date) entries.push({ uid: `maint-${m.id}`, date: m.next_due_date, title: `Maintenance: ${m.task}` });
  }
  for (const p of (projects.data ?? []) as Project[]) {
    if (!p.archived_at && p.target_completion_date)
      entries.push({ uid: `project-${p.id}`, date: p.target_completion_date, title: `${p.name} target` });
  }
  for (const d of (docs.data ?? []) as Document[]) {
    if (d.expiry_date) entries.push({ uid: `doc-${d.id}`, date: d.expiry_date, title: `${d.name} expires` });
  }
  for (const mo of (mortgages.data ?? []) as Mortgage[]) {
    if (mo.fixed_term_end_date) entries.push({ uid: `mortgage-${mo.id}`, date: mo.fixed_term_end_date, title: "Mortgage fixed term ends" });
  }
  for (const pot of (pots.data ?? []) as SavingsPot[]) {
    if (pot.target_date) entries.push({ uid: `pot-${pot.id}`, date: pot.target_date, title: `${pot.name} savings target` });
  }
  for (const t of (tasks.data ?? []) as ProjectTask[]) {
    if (!t.archived_at && t.due_date && !t.is_done) entries.push({ uid: `task-${t.id}`, date: t.due_date, title: t.title });
  }
  for (const ev of (calEvents.data ?? []) as CalendarEvent[]) {
    entries.push({ uid: `event-${ev.id}`, date: ev.event_date, title: ev.title, rrule: EVENT_RRULE[ev.recurrence] });
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//My House Dashboard//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:My House",
  ];
  for (const e of entries) {
    const start = compact(e.date);
    const endDate = compact(new Date(new Date(`${e.date}T00:00:00`).getTime() + 86400000).toISOString().slice(0, 10));
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@myhouse`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `SUMMARY:${escapeText(e.title)}`,
      ...(e.rrule ? [`RRULE:${e.rrule}`] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="my-house.ics"',
    },
  });
}
