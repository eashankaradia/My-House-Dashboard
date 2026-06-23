import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarDays } from "lucide-react";
import type {
  Bill,
  Document,
  MaintenanceTask,
  Mortgage,
  Project,
  ProjectTask,
  SavingsPot,
} from "@/lib/database.types";
import { CalendarView, type CalEvent } from "./calendar-view";

export const metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const supabase = await createClient();
  const [bills, maint, projects, docs, mortgages, pots, tasks] = await Promise.all([
    supabase.from("bills").select("*"),
    supabase.from("maintenance_tasks").select("*"),
    supabase.from("projects").select("*"),
    supabase.from("documents").select("*"),
    supabase.from("mortgages").select("*"),
    supabase.from("savings_pots").select("*"),
    supabase.from("project_tasks").select("*"),
  ]);

  const events: CalEvent[] = [];

  for (const b of (bills.data ?? []) as Bill[]) {
    if (b.due_date) events.push({ date: b.due_date, title: `${b.name} due`, type: "bill", href: "/bills" });
  }
  for (const m of (maint.data ?? []) as MaintenanceTask[]) {
    if (m.next_due_date)
      events.push({ date: m.next_due_date, title: m.task, type: "maintenance", href: "/maintenance" });
  }
  for (const p of (projects.data ?? []) as Project[]) {
    if (p.target_completion_date)
      events.push({ date: p.target_completion_date, title: `${p.name} target`, type: "project", href: "/projects" });
  }
  for (const d of (docs.data ?? []) as Document[]) {
    if (d.expiry_date)
      events.push({ date: d.expiry_date, title: `${d.name} expires`, type: "document", href: "/documents" });
  }
  for (const mo of (mortgages.data ?? []) as Mortgage[]) {
    if (mo.fixed_term_end_date)
      events.push({ date: mo.fixed_term_end_date, title: "Mortgage fixed term ends", type: "mortgage", href: "/mortgage" });
  }
  for (const pot of (pots.data ?? []) as SavingsPot[]) {
    if (pot.target_date)
      events.push({ date: pot.target_date, title: `${pot.name} target`, type: "savings", href: "/savings" });
  }
  for (const t of (tasks.data ?? []) as ProjectTask[]) {
    if (t.due_date && !t.is_done)
      events.push({ date: t.due_date, title: t.title, type: "task", href: "/tasks" });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Every key date across your home in one view."
        info="Shows bill due dates, maintenance, project targets, document renewals, your mortgage fixed-term end and savings targets. Click any event to jump to it. Add dates in each section to populate the calendar."
      />
      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No dates yet"
          description="Add due dates to bills, next-due dates to maintenance, target dates to projects and savings, or expiry dates to documents — they'll all show up here."
        />
      ) : (
        <CalendarView events={events} />
      )}
    </div>
  );
}
