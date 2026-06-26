import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { priorityVariant } from "@/lib/ui";
import { daysUntil, formatCurrency, formatDate, toAnnual, toMonthly } from "@/lib/utils";
import { getHouseholdMap } from "@/lib/household";
import type {
  Bill,
  CalendarEvent,
  Document,
  Inspiration,
  MaintenanceTask,
  Mortgage,
  Project,
  ProjectTask,
  Purchase,
  SavingsPot,
} from "@/lib/database.types";
import { DashboardWidget, EditDashboardButton } from "./dashboard-customize";
import { CollapsibleSection } from "./collapsible-section";
import { WeekAhead } from "./week-ahead";
import { GlanceStats, type GlanceValue } from "./glance-stats";
import { SectionActivityLog } from "@/components/shared/section-activity-log";

export const metadata = { title: "Dashboard" };

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Does a (maybe recurring) calendar event fall on date d? */
function eventOccursOn(ev: CalendarEvent, d: Date): boolean {
  const base = new Date(`${ev.event_date}T00:00:00`);
  if (ev.recurrence === "none") return ymd(base) === ymd(d);
  if (d < base) return false;
  if (ev.recurrence === "weekly") return d.getDay() === base.getDay();
  if (ev.recurrence === "monthly") return d.getDate() === base.getDate();
  if (ev.recurrence === "yearly") return d.getDate() === base.getDate() && d.getMonth() === base.getMonth();
  return false;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    billsRes,
    potsRes,
    projectsRes,
    tasksRes,
    purchasesRes,
    inspoRes,
    maintRes,
    docsRes,
    mortgageRes,
    memberMap,
    calEventsRes,
  ] = await Promise.all([
    supabase.from("bills").select("*"),
    supabase.from("savings_pots").select("*"),
    supabase.from("projects").select("*").order("updated_at", { ascending: false }),
    supabase.from("project_tasks").select("*"),
    supabase.from("purchases").select("*").order("created_at", { ascending: false }),
    supabase.from("inspiration").select("*").order("updated_at", { ascending: false }).limit(5),
    supabase.from("maintenance_tasks").select("*"),
    supabase.from("documents").select("*"),
    supabase.from("mortgages").select("*").limit(1),
    getHouseholdMap(),
    supabase.from("calendar_events").select("*"),
  ]);

  const bills = (billsRes.data ?? []) as Bill[];
  const pots = (potsRes.data ?? []) as SavingsPot[];
  const projects = ((projectsRes.data ?? []) as Project[]).filter((p) => !p.archived_at);
  const allTasks = ((tasksRes.data ?? []) as ProjectTask[]).filter((t) => !t.archived_at);
  const purchases = ((purchasesRes.data ?? []) as Purchase[]).filter((p) => !p.archived_at);
  const inspiration = (inspoRes.data ?? []) as Inspiration[];
  const maintenance = (maintRes.data ?? []) as MaintenanceTask[];
  const documents = (docsRes.data ?? []) as Document[];
  const mortgage = (mortgageRes.data?.[0] as Mortgage | undefined) ?? undefined;
  const calEvents = (calEventsRes.data ?? []) as CalendarEvent[];

  // --- Week ahead: how much is on each of the next 7 days -------------------
  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);
  const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today0);
    d.setDate(d.getDate() + i);
    const key = ymd(d);
    const items: { label: string; sub: string; href: string }[] = [];
    for (const b of bills.filter((x) => x.due_date === key))
      items.push({ label: b.name, sub: `Bill · ${formatCurrency(b.amount)}`, href: `/bills?item=${b.id}` });
    for (const t of allTasks.filter((x) => !x.is_done && x.due_date === key))
      items.push({ label: t.title, sub: "Task", href: `/projects?task=${t.id}` });
    for (const m of maintenance.filter((x) => x.next_due_date === key))
      items.push({ label: m.task, sub: "Maintenance", href: `/maintenance?item=${m.id}` });
    for (const doc of documents.filter((x) => x.expiry_date === key))
      items.push({ label: `${doc.name} expires`, sub: "Document", href: `/documents?item=${doc.id}` });
    for (const p of projects.filter((x) => x.target_completion_date === key))
      items.push({ label: p.name, sub: "Project target", href: `/projects?project=${p.id}` });
    for (const p of pots.filter((x) => x.target_date === key))
      items.push({ label: p.name, sub: "Savings target", href: `/savings?item=${p.id}` });
    for (const ev of calEvents.filter((x) => eventOccursOn(x, d)))
      items.push({ label: ev.title, sub: "Event", href: `/calendar?item=${ev.id}` });
    return { key, dayNum: d.getDate(), weekday: WD[d.getDay()], isToday: i === 0, count: items.length, items };
  });

  // --- Headline numbers worth a glance -------------------------------------
  const savedTotal = pots.reduce((s, p) => s + Number(p.current_amount), 0);
  const monthlyTarget = pots.reduce((s, p) => s + Number(p.monthly_contribution), 0);

  const nextBill = bills
    .filter((b) => b.due_date && (daysUntil(b.due_date) ?? -1) >= 0)
    .sort((a, b) => (daysUntil(a.due_date) ?? 0) - (daysUntil(b.due_date) ?? 0))[0];

  const readyToBuy = purchases.filter((p) => p.status === "Ready To Buy");
  const readyToBuyValue = readyToBuy.reduce((s, p) => s + Number(p.price), 0);

  // --- Values for every customisable glance stat ---------------------------
  const monthlyBills = bills.reduce((s, b) => s + toMonthly(b.amount, b.frequency), 0);
  const annualBills = bills.reduce((s, b) => s + toAnnual(b.amount, b.frequency), 0);
  const openTaskTotal = allTasks.filter((t) => !t.is_done).length;
  const activeProjectsCount = projects.filter((p) => p.status !== "Completed").length;
  const wishlistCount = purchases.filter((p) => p.status !== "Purchased").length;
  const maintenanceDueCount = maintenance.filter((m) => {
    const d = daysUntil(m.next_due_date);
    return d !== null && d <= 30;
  }).length;

  const glanceValues: Record<string, GlanceValue> = {
    nextBill: {
      value: nextBill ? formatDate(nextBill.due_date) : "—",
      hint: nextBill ? `${nextBill.name} · ${formatCurrency(nextBill.amount)}` : "Nothing scheduled",
    },
    monthlyBills: { value: formatCurrency(monthlyBills), hint: `${formatCurrency(annualBills)}/yr` },
    savingsBalance: { value: formatCurrency(savedTotal), hint: `Target ${formatCurrency(monthlyTarget)}/mo` },
    readyToBuy: { value: formatCurrency(readyToBuyValue), hint: `${readyToBuy.length} item${readyToBuy.length === 1 ? "" : "s"}` },
    wishlistItems: { value: String(wishlistCount), hint: "to buy" },
    openTasks: { value: String(openTaskTotal), hint: "across projects" },
    activeProjects: { value: String(activeProjectsCount), hint: "in progress" },
    maintenanceDue: { value: String(maintenanceDueCount), hint: "next 30 days" },
    dueThisWeek: { value: String(weekDays.reduce((s, d) => s + d.count, 0)), hint: "items in 7 days" },
  };

  // --- Open projects (one line each) + the tasks due soonest ----------------
  const openProjects = projects.filter((p) => p.status !== "Completed");
  const openTaskCount = (projectId: string) =>
    allTasks.filter((t) => t.project_id === projectId && !t.is_done).length;
  const projectName = new Map(projects.map((p) => [p.id, p.name]));

  const upcomingTasks = allTasks
    .filter((t) => !t.is_done && t.due_date)
    .map((t) => ({ task: t, days: daysUntil(t.due_date) }))
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
    .slice(0, 5);

  // --- Renewal reminders ----------------------------------------------------
  type Reminder = { label: string; date: string | null; days: number; href: string };
  const reminders: Reminder[] = [];
  for (const b of bills) {
    const d = daysUntil(b.due_date);
    if (d !== null && d <= 14) reminders.push({ label: `${b.name} bill`, date: b.due_date, days: d, href: `/bills?item=${b.id}` });
  }
  for (const doc of documents) {
    const d = daysUntil(doc.expiry_date);
    if (d !== null && d <= 60) reminders.push({ label: `${doc.name} expires`, date: doc.expiry_date, days: d, href: `/documents?item=${doc.id}` });
  }
  if (mortgage?.fixed_term_end_date) {
    const d = daysUntil(mortgage.fixed_term_end_date);
    if (d !== null && d <= 180)
      reminders.push({ label: "Mortgage fixed term ends", date: mortgage.fixed_term_end_date, days: d, href: "/mortgage" });
  }
  reminders.sort((a, b) => a.days - b.days);

  // --- Upcoming maintenance -------------------------------------------------
  const upcomingMaint = maintenance
    .map((m) => ({ task: m, days: daysUntil(m.next_due_date) }))
    .filter((x) => x.days !== null)
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
    .slice(0, 5);

  // --- Recently added to the wishlist (not yet purchased) -------------------
  const recentPurchases = purchases.filter((p) => p.status !== "Purchased").slice(0, 5);

  const greeting = getGreeting();
  const myName =
    (user && memberMap[user.id]) ||
    ((user?.user_metadata?.full_name as string) ?? (user?.user_metadata?.name as string) ?? "").split(" ")[0] ||
    "there";

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting}, {myName}
          </h1>
          <p className="text-muted-foreground">Here&apos;s what needs your attention.</p>
        </div>
        <EditDashboardButton />
      </div>

      {/* Glance stats (user-customisable in Settings) */}
      <DashboardWidget id="finance">
        <GlanceStats values={glanceValues} />
      </DashboardWidget>

      {/* Week ahead */}
      <DashboardWidget id="week">
        <WeekAhead days={weekDays} />
      </DashboardWidget>

      {/* Renewal reminders */}
      <DashboardWidget id="reminders">
        <CollapsibleSection title="Renewal reminders" href="/calendar" count={reminders.length}>
          {reminders.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">Nothing needs attention. 🎉</p>
          ) : (
            reminders.slice(0, 6).map((r, i) => (
              <RowLink key={i} href={r.href}>
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.date)}</p>
                </div>
                {r.days < 0 ? (
                  <Badge variant="destructive">{Math.abs(r.days)}d late</Badge>
                ) : (
                  <Badge variant={r.days <= 14 ? "warning" : "secondary"}>{r.days}d</Badge>
                )}
              </RowLink>
            ))
          )}
        </CollapsibleSection>
      </DashboardWidget>

      {/* Open projects + upcoming tasks */}
      <DashboardWidget id="projects">
        <CollapsibleSection title="Open projects" href="/projects" count={openProjects.length}>
          {openProjects.length === 0 ? (
            <Empty href="/projects" label="Start a home project" />
          ) : (
            openProjects.slice(0, 6).map((p) => {
              const todo = openTaskCount(p.id);
              return (
                <RowLink key={p.id} href={`/projects?project=${p.id}`}>
                  <p className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground"> · {p.status}</span>
                    {todo > 0 ? <span className="text-muted-foreground"> · {todo} to do</span> : null}
                  </p>
                  <Badge variant={priorityVariant(p.priority)}>{p.priority}</Badge>
                </RowLink>
              );
            })
          )}

          {upcomingTasks.length > 0 ? (
            <div className="pt-1">
              <p className="px-1 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Upcoming tasks
              </p>
              {upcomingTasks.map(({ task, days }) => (
                <RowLink key={task.id} href={`/projects?task=${task.id}`}>
                  <div className="min-w-0">
                    <p className="truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.project_id ? `${projectName.get(task.project_id) ?? "Project"} · ` : ""}
                      {formatDate(task.due_date)}
                    </p>
                  </div>
                  {days !== null && days < 0 ? (
                    <Badge variant="destructive">{Math.abs(days)}d late</Badge>
                  ) : (
                    <Badge variant={days !== null && days <= 7 ? "warning" : "secondary"}>{days}d</Badge>
                  )}
                </RowLink>
              ))}
            </div>
          ) : null}
        </CollapsibleSection>
      </DashboardWidget>

      {/* Upcoming maintenance */}
      <DashboardWidget id="maintenance">
        <CollapsibleSection title="Upcoming maintenance" href="/maintenance" count={upcomingMaint.length}>
          {upcomingMaint.length === 0 ? (
            <Empty href="/maintenance" label="Add a maintenance task" />
          ) : (
            upcomingMaint.map(({ task, days }) => (
              <RowLink key={task.id} href={`/maintenance?item=${task.id}`}>
                <div className="min-w-0">
                  <p className="truncate font-medium">{task.task}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(task.next_due_date)}</p>
                </div>
                {days !== null && days < 0 ? (
                  <Badge variant="destructive">overdue</Badge>
                ) : (
                  <Badge variant={days !== null && days <= 30 ? "warning" : "secondary"}>{days}d</Badge>
                )}
              </RowLink>
            ))
          )}
        </CollapsibleSection>
      </DashboardWidget>

      {/* Recent inspiration (timestamped) */}
      <DashboardWidget id="inspiration">
        <CollapsibleSection title="Recent inspiration" href="/inspiration" count={inspiration.length}>
          {inspiration.length === 0 ? (
            <Empty href="/inspiration" label="Save your first idea" />
          ) : (
            inspiration.map((i) => (
              <RowLink key={i.id} href={`/inspiration?item=${i.id}`}>
                <div className="min-w-0">
                  <p className="truncate font-medium">{i.title}</p>
                  <p className="text-xs text-muted-foreground">{[i.source, i.room].filter(Boolean).join(" · ")}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(i.updated_at)}</span>
              </RowLink>
            ))
          )}
        </CollapsibleSection>
      </DashboardWidget>

      {/* Recently added to the wishlist (timestamped, excludes purchased) */}
      <DashboardWidget id="purchases">
        <CollapsibleSection title="Added to wishlist" href="/purchases" count={recentPurchases.length}>
          {recentPurchases.length === 0 ? (
            <Empty href="/purchases" label="Add to your wishlist" />
          ) : (
            recentPurchases.map((p) => (
              <RowLink key={p.id} href={`/purchases?item=${p.id}`}>
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.status}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(p.created_at)}</span>
              </RowLink>
            ))
          )}
        </CollapsibleSection>
      </DashboardWidget>

      {/* What everyone in the household has been doing */}
      <DashboardWidget id="activity">
        <SectionActivityLog title="Activity by household" limit={12} excludeSelf />
      </DashboardWidget>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** A dashboard list row that links to its item, with a tappable hover state. */
function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="-mx-2 flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent active:bg-accent"
    >
      {children}
    </Link>
  );
}

function Empty({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-1 rounded-lg border border-dashed py-4 text-center text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      {label} <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}
