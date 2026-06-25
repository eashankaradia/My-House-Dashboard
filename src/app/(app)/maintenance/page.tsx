import { AlertTriangle, CalendarClock, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { daysUntil, formatCurrency } from "@/lib/utils";
import { getHouseholdMap } from "@/lib/household";
import type { MaintenanceTask } from "@/lib/database.types";
import { MaintenanceForm } from "./maintenance-form";
import { MaintenanceList } from "./maintenance-list";
import { SectionActivityLog } from "@/components/shared/section-activity-log";

export const metadata = { title: "Maintenance" };

export default async function MaintenancePage() {
  const supabase = await createClient();
  const [{ data }, memberMap] = await Promise.all([
    supabase
      .from("maintenance_tasks")
      .select("*")
      .order("next_due_date", { ascending: true, nullsFirst: false }),
    getHouseholdMap(),
  ]);
  const tasks = (data ?? []) as MaintenanceTask[];

  const overdue = tasks.filter((t) => {
    const d = daysUntil(t.next_due_date);
    return d !== null && d < 0;
  });
  const dueSoon = tasks.filter((t) => {
    const d = daysUntil(t.next_due_date);
    return d !== null && d >= 0 && d <= 30;
  });
  const annualCost = tasks.reduce((s, t) => s + Number(t.cost), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance" description="Keep your home in great shape, on schedule." info="Add recurring jobs like boiler servicing or gutter cleaning and set how often they're due — we work out the next date. Tap Done when you complete one and it rolls forward automatically. Overdue and due-soon tasks are highlighted.">
        <MaintenanceForm />
      </PageHeader>

      {tasks.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No maintenance tasks yet"
          description="Add recurring jobs like boiler servicing, gutter cleaning or smoke-alarm testing and never miss one again."
        >
          <MaintenanceForm />
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Overdue" value={String(overdue.length)} icon={AlertTriangle} accent={overdue.length ? "destructive" : "muted"} />
            <StatCard label="Due within 30 days" value={String(dueSoon.length)} icon={CalendarClock} accent={dueSoon.length ? "warning" : "muted"} />
            <StatCard label="Annual upkeep cost" value={formatCurrency(annualCost)} icon={Wrench} />
          </div>

          <MaintenanceList tasks={tasks} memberMap={memberMap} />
        </>
      )}
      <SectionActivityLog entityTypes={["maintenance_tasks"]} />
    </div>
  );
}
