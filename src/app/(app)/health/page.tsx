import { Heart, Scale, Activity, Pill, CalendarCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { HealthRecord, Medication, Appointment } from "@/lib/database.types";
import { HEALTH_RECORD_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { HealthAddMenu, LogHealthRecordForm } from "./health-forms";

export const metadata = { title: "Health" };

export default async function HealthPage() {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [recordsRes, medsRes, appointmentsRes] = await Promise.all([
    supabase
      .from("health_records")
      .select("*")
      .gte("recorded_at", thirtyDaysAgo)
      .order("recorded_at", { ascending: false })
      .limit(20),
    supabase
      .from("medications")
      .select("*")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("appointments")
      .select("*")
      .neq("status", "Cancelled")
      .order("appointment_date", { ascending: true })
      .limit(10),
  ]);

  const records = (recordsRes.data ?? []) as HealthRecord[];
  const medications = (medsRes.data ?? []) as Medication[];
  const appointments = (appointmentsRes.data ?? []) as Appointment[];

  const latestWeight = records.find((r) => r.record_type === "weight");
  const latestBP = records.find((r) => r.record_type === "blood_pressure");
  const upcomingAppointments = appointments.filter(
    (a) => a.appointment_date >= new Date().toISOString().slice(0, 10) && a.status === "Upcoming",
  );

  const hasData = records.length > 0 || medications.length > 0 || appointments.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Health"
        description="Track your health metrics, appointments and medication."
        info="Your health data is private to you. Log weight, blood pressure, appointments and more."
      >
        <HealthAddMenu />
      </PageHeader>

      {!hasData ? (
        <EmptyState
          icon={Heart}
          title="No health records yet"
          description="Start tracking your health. Log your weight, blood pressure, appointments and medication. Spot trends and stay on top of what matters."
        >
          <LogHealthRecordForm />
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {/* Snapshot */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SnapCard
              icon={Scale}
              label="Weight"
              value={latestWeight ? `${latestWeight.value} ${latestWeight.unit ?? "kg"}` : "—"}
              hint={latestWeight ? formatDate(latestWeight.recorded_at) : "Not logged"}
            />
            <SnapCard
              icon={Activity}
              label="Blood Pressure"
              value={latestBP && latestBP.value && latestBP.value2 ? `${latestBP.value}/${latestBP.value2}` : "—"}
              hint={latestBP ? formatDate(latestBP.recorded_at) : "Not logged"}
            />
            <SnapCard
              icon={Pill}
              label="Medications"
              value={String(medications.length)}
              hint="active"
            />
            <SnapCard
              icon={CalendarCheck}
              label="Appointments"
              value={String(upcomingAppointments.length)}
              hint="upcoming"
            />
          </div>

          {/* Upcoming appointments */}
          {upcomingAppointments.length > 0 && (
            <section className="space-y-2">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Upcoming appointments
              </h2>
              <div className="space-y-2">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CalendarCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{apt.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(apt.appointment_date)}
                        {apt.provider ? ` · ${apt.provider}` : ""}
                        {apt.appointment_time ? ` · ${apt.appointment_time}` : ""}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Active medications */}
          {medications.length > 0 && (
            <section className="space-y-2">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Active medications
              </h2>
              <div className="space-y-1.5">
                {medications.map((med) => (
                  <div key={med.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Pill className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{med.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[med.dosage, med.frequency].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent records */}
          {records.length > 0 && (
            <section className="space-y-2">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Recent records
              </h2>
              <div className="space-y-1.5">
                {records.slice(0, 10).map((record) => (
                  <div key={record.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {HEALTH_RECORD_LABELS[record.record_type] ?? record.record_type}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(record.recorded_at)}</p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums">
                      {record.record_type === "blood_pressure" && record.value2
                        ? `${record.value}/${record.value2}`
                        : record.value}
                      {record.unit ? ` ${record.unit}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function SnapCard({ icon: Icon, label, value, hint }: { icon: typeof Heart; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-1.5 text-xl font-bold leading-none">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
