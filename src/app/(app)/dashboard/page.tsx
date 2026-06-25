import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  Hammer,
  Lightbulb,
  PiggyBank,
  Receipt,
  ShoppingBag,
  Wallet,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/shared/stat-card";
import { InfoHint } from "@/components/shared/info-hint";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { priorityVariant } from "@/lib/ui";
import { daysUntil, formatCurrency, formatDate, toAnnual, toMonthly } from "@/lib/utils";
import type {
  Bill,
  Collection,
  Document,
  Inspiration,
  MaintenanceTask,
  Mortgage,
  Project,
  Purchase,
  SavingsPot,
} from "@/lib/database.types";
import { QuickActions } from "./quick-actions";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    billsRes,
    potsRes,
    projectsRes,
    purchasesRes,
    inspoRes,
    maintRes,
    docsRes,
    mortgageRes,
    collectionsRes,
  ] = await Promise.all([
    supabase.from("bills").select("*"),
    supabase.from("savings_pots").select("*"),
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("purchases").select("*").order("created_at", { ascending: false }),
    supabase.from("inspiration").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("maintenance_tasks").select("*"),
    supabase.from("documents").select("*"),
    supabase.from("mortgages").select("*").limit(1),
    supabase.from("collections").select("*").order("name"),
  ]);

  const bills = (billsRes.data ?? []) as Bill[];
  const pots = (potsRes.data ?? []) as SavingsPot[];
  const projects = (projectsRes.data ?? []) as Project[];
  const purchases = (purchasesRes.data ?? []) as Purchase[];
  const inspiration = (inspoRes.data ?? []) as Inspiration[];
  const maintenance = (maintRes.data ?? []) as MaintenanceTask[];
  const documents = (docsRes.data ?? []) as Document[];
  const mortgage = (mortgageRes.data?.[0] as Mortgage | undefined) ?? undefined;
  const collections = (collectionsRes.data ?? []) as Collection[];

  // --- Financial summary ----------------------------------------------------
  const monthlyBills = bills.reduce((s, b) => s + toMonthly(b.amount, b.frequency), 0);
  const annualBills = bills.reduce((s, b) => s + toAnnual(b.amount, b.frequency), 0);
  const monthlyTarget = pots.reduce((s, p) => s + Number(p.monthly_contribution), 0);
  const savedTotal = pots.reduce((s, p) => s + Number(p.current_amount), 0);
  const targetTotal = pots.reduce((s, p) => s + Number(p.target_amount), 0);

  const nextBill = bills
    .filter((b) => b.due_date && (daysUntil(b.due_date) ?? -1) >= 0)
    .sort((a, b) => (daysUntil(a.due_date) ?? 0) - (daysUntil(b.due_date) ?? 0))[0];

  const readyToBuy = purchases.filter((p) => p.status === "Ready To Buy");
  const readyToBuyValue = readyToBuy.reduce((s, p) => s + Number(p.price), 0);

  const openProjects = projects.filter((p) => p.status !== "Completed");

  // --- Renewal reminders (bills due, docs expiring, mortgage fix end) --------
  type Reminder = { label: string; date: string | null; days: number; href: string };
  const reminders: Reminder[] = [];
  for (const b of bills) {
    const d = daysUntil(b.due_date);
    if (d !== null && d <= 14) reminders.push({ label: `${b.name} bill`, date: b.due_date, days: d, href: "/bills" });
  }
  for (const doc of documents) {
    const d = daysUntil(doc.expiry_date);
    if (d !== null && d <= 60) reminders.push({ label: `${doc.name} expires`, date: doc.expiry_date, days: d, href: "/documents" });
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

  const greeting = getGreeting();
  const firstName =
    ((user?.user_metadata?.full_name as string) ?? (user?.user_metadata?.name as string) ?? "")
      .split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting}, {firstName}
          </h1>
          <InfoHint text="Your home at a glance. The cards summarise your finances, savings, projects, reminders and recent activity — they update automatically as you add things. Use the buttons below to add anything quickly, or the sidebar to open a section." />
        </div>
        <p className="text-muted-foreground">Here&apos;s how your home is doing today.</p>
      </div>

      <QuickActions collections={collections} />

      {/* Financial summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Monthly bills" value={formatCurrency(monthlyBills)} hint={`${formatCurrency(annualBills)}/yr`} icon={Receipt} />
        <StatCard
          label="Next bill due"
          value={nextBill ? formatDate(nextBill.due_date) : "—"}
          hint={nextBill ? `${nextBill.name} · ${formatCurrency(nextBill.amount)}` : "Nothing scheduled"}
          icon={CalendarClock}
          accent="muted"
        />
        <StatCard label="Savings balance" value={formatCurrency(savedTotal)} hint={`Target ${formatCurrency(monthlyTarget)}/mo`} icon={PiggyBank} />
        <StatCard
          label="Ready to buy"
          value={formatCurrency(readyToBuyValue)}
          hint={`${readyToBuy.length} item${readyToBuy.length === 1 ? "" : "s"} shortlisted`}
          icon={ShoppingBag}
          accent="muted"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Savings progress */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Savings progress</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {pots.length === 0 ? (
              <Empty href="/savings" label="Create your first savings pot" icon={PiggyBank} />
            ) : (
              <>
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-2xl font-semibold">{formatCurrency(savedTotal)}</span>
                    <span className="text-xs text-muted-foreground">of {formatCurrency(targetTotal)}</span>
                  </div>
                  <Progress value={targetTotal ? (savedTotal / targetTotal) * 100 : 0} />
                </div>
                <div className="space-y-2.5">
                  {pots.slice(0, 4).map((p) => {
                    const pct = p.target_amount ? Math.min(100, (p.current_amount / p.target_amount) * 100) : 0;
                    return (
                      <RowLink key={p.id} href="/savings">
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="truncate">{p.name}</span>
                          <span className="text-muted-foreground">{Math.round(pct)}%</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </RowLink>
                    );
                  })}
                </div>
                <SeeAll href="/savings" />
              </>
            )}
          </CardContent>
        </Card>

        {/* Open projects */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Open projects</CardTitle>
            <Hammer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {openProjects.length === 0 ? (
              <Empty href="/projects" label="Start a home project" icon={Hammer} />
            ) : (
              <>
                {openProjects.slice(0, 5).map((p) => (
                  <RowLink key={p.id} href="/projects" className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.status}</p>
                    </div>
                    <Badge variant={priorityVariant(p.priority)}>{p.priority}</Badge>
                  </RowLink>
                ))}
                <SeeAll href="/projects" />
              </>
            )}
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Renewal reminders</CardTitle>
            <BellRing className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {reminders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nothing needs attention. 🎉</p>
            ) : (
              reminders.slice(0, 6).map((r, i) => (
                <RowLink key={i} href={r.href} className="flex items-center justify-between gap-2 text-sm">
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
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Upcoming maintenance */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Upcoming maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingMaint.length === 0 ? (
              <Empty href="/maintenance" label="Add a maintenance task" icon={Wrench} />
            ) : (
              <>
                {upcomingMaint.map(({ task, days }) => (
                  <RowLink key={task.id} href="/maintenance" className="flex items-center justify-between gap-2 text-sm">
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
                ))}
                <SeeAll href="/maintenance" />
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent inspiration */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent inspiration</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {inspiration.length === 0 ? (
              <Empty href="/inspiration" label="Save your first idea" icon={Lightbulb} />
            ) : (
              <>
                {inspiration.map((i) => (
                  <RowLink key={i.id} href="/inspiration" className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{i.title}</p>
                      <p className="text-xs text-muted-foreground">{[i.source, i.room].filter(Boolean).join(" · ")}</p>
                    </div>
                    <Badge variant="secondary">{i.status}</Badge>
                  </RowLink>
                ))}
                <SeeAll href="/inspiration" />
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent purchases */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent purchases</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {purchases.length === 0 ? (
              <Empty href="/purchases" label="Add to your wishlist" icon={ShoppingBag} />
            ) : (
              <>
                {purchases.slice(0, 5).map((p) => (
                  <RowLink key={p.id} href="/purchases" className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.status}</p>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(p.price)}</span>
                  </RowLink>
                ))}
                <SeeAll href="/purchases" />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** A dashboard list row that links to its section, with a tappable hover state. */
function RowLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`-mx-2 block rounded-md px-2 py-1.5 transition-colors hover:bg-accent active:bg-accent ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}

function SeeAll({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-primary hover:underline"
    >
      See all <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

function Empty({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Hammer }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
