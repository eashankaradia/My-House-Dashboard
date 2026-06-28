import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Hammer,
  PiggyBank,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { daysUntil, formatCurrency, formatDate, toMonthly } from "@/lib/utils";
import type {
  Bill,
  BillPayment,
  Document,
  MaintenanceTask,
  Project,
  ProjectTask,
  Purchase,
  SavingsPot,
} from "@/lib/database.types";

export const metadata = { title: "House Assistant" };

type AssistantItem = {
  title: string;
  detail: string;
  href: string;
  tone: "danger" | "warning" | "good" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
};

export default async function AssistantPage() {
  const supabase = await createClient();
  const [billsRes, paymentsRes, tasksRes, projectsRes, purchasesRes, potsRes, maintRes, docsRes] = await Promise.all([
    supabase.from("bills").select("*"),
    supabase.from("bill_payments").select("*"),
    supabase.from("project_tasks").select("*"),
    supabase.from("projects").select("*"),
    supabase.from("purchases").select("*"),
    supabase.from("savings_pots").select("*"),
    supabase.from("maintenance_tasks").select("*"),
    supabase.from("documents").select("*"),
  ]);

  const bills = (billsRes.data ?? []) as Bill[];
  const payments = (paymentsRes.data ?? []) as BillPayment[];
  const tasks = ((tasksRes.data ?? []) as ProjectTask[]).filter((t) => !t.archived_at);
  const projects = ((projectsRes.data ?? []) as Project[]).filter((p) => !p.archived_at);
  const purchases = ((purchasesRes.data ?? []) as Purchase[]).filter((p) => !p.archived_at);
  const pots = (potsRes.data ?? []) as SavingsPot[];
  const maintenance = (maintRes.data ?? []) as MaintenanceTask[];
  const documents = (docsRes.data ?? []) as Document[];

  const billName = new Map(bills.map((b) => [b.id, b.name]));
  const unpaidDue = payments
    .filter((p) => !p.is_paid && (daysUntil(p.payment_date) ?? 999) <= 0)
    .map<AssistantItem>((p) => {
      const d = daysUntil(p.payment_date) ?? 0;
      return {
        title: `Pay ${billName.get(p.bill_id) ?? "bill"}`,
        detail: `${d < 0 ? `${Math.abs(d)}d overdue` : "Due today"} - ${formatCurrency(p.expected_amount)}`,
        href: `/bills?item=${p.bill_id}`,
        tone: d < 0 ? "danger" : "warning",
        icon: Receipt,
      };
    });

  const dueTasks = tasks
    .filter((t) => !t.is_done && t.due_date && (daysUntil(t.due_date) ?? 999) <= 7)
    .sort((a, b) => (daysUntil(a.due_date) ?? 0) - (daysUntil(b.due_date) ?? 0))
    .slice(0, 6)
    .map<AssistantItem>((t) => {
      const d = daysUntil(t.due_date) ?? 0;
      return {
        title: t.title,
        detail: d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? "Due today" : `Due in ${d}d`,
        href: `/projects?task=${t.id}`,
        tone: d < 0 ? "danger" : "warning",
        icon: ClipboardList,
      };
    });

  const dueMaintenance = maintenance
    .filter((m) => (daysUntil(m.next_due_date) ?? 999) <= 30)
    .sort((a, b) => (daysUntil(a.next_due_date) ?? 0) - (daysUntil(b.next_due_date) ?? 0))
    .slice(0, 5)
    .map<AssistantItem>((m) => {
      const d = daysUntil(m.next_due_date) ?? 0;
      return {
        title: m.task,
        detail: d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? "Due today" : `Due in ${d}d`,
        href: `/maintenance?item=${m.id}`,
        tone: d < 0 ? "danger" : "warning",
        icon: Wrench,
      };
    });

  const documentRisks = documents
    .filter((doc) => (daysUntil(doc.expiry_date) ?? 999) <= 60)
    .sort((a, b) => (daysUntil(a.expiry_date) ?? 0) - (daysUntil(b.expiry_date) ?? 0))
    .slice(0, 5)
    .map<AssistantItem>((doc) => {
      const d = daysUntil(doc.expiry_date) ?? 0;
      return {
        title: `${doc.name} expires`,
        detail: d < 0 ? `${Math.abs(d)}d ago` : d === 0 ? "Today" : `In ${d}d`,
        href: `/documents?item=${doc.id}`,
        tone: d <= 7 ? "danger" : "warning",
        icon: ShieldCheck,
      };
    });

  const monthlyBills = bills.reduce((sum, bill) => sum + toMonthly(bill.amount, bill.frequency), 0);
  const monthlySavings = pots.reduce((sum, pot) => sum + Number(pot.monthly_contribution), 0);
  const savedTotal = pots.reduce((sum, pot) => sum + Number(pot.current_amount), 0);
  const savingsTarget = pots.reduce((sum, pot) => sum + Number(pot.target_amount), 0);
  const openProjects = projects.filter((p) => p.status !== "Completed");
  const projectPipeline = openProjects.reduce((sum, project) => sum + Number(project.estimated_cost), 0);
  const readyToBuy = purchases.filter((p) => p.status === "Ready To Buy");
  const readyToBuyValue = readyToBuy.reduce((sum, purchase) => sum + Number(purchase.price), 0);
  const wishlistValue = purchases.filter((p) => p.status !== "Purchased").reduce((sum, purchase) => sum + Number(purchase.price), 0);

  const suggestions: AssistantItem[] = [
    ...unpaidDue,
    ...dueTasks,
    ...dueMaintenance,
    ...documentRisks,
  ];

  if (readyToBuy.length > 0) {
    suggestions.push({
      title: `${readyToBuy.length} purchase${readyToBuy.length === 1 ? "" : "s"} ready to buy`,
      detail: `${formatCurrency(readyToBuyValue)} total - check budget before buying`,
      href: "/purchases",
      tone: readyToBuyValue > savedTotal * 0.25 ? "warning" : "neutral",
      icon: ShoppingBag,
    });
  }

  if (monthlySavings === 0 && pots.length > 0) {
    suggestions.push({
      title: "Add monthly savings contributions",
      detail: "Your pots have targets but no monthly plan yet.",
      href: "/savings",
      tone: "neutral",
      icon: PiggyBank,
    });
  }

  const topActions = suggestions
    .sort((a, b) => toneRank(a.tone) - toneRank(b.tone))
    .slice(0, 10);
  const allClear = topActions.length === 0;
  const savingsProgress = savingsTarget > 0 ? Math.round((savedTotal / savingsTarget) * 100) : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="House Assistant"
        description="Free guidance generated from your own app data. No AI API, no paid model, no ChatGPT subscription required."
        info="This assistant is rule-based: it queries your bills, tasks, projects, purchases, savings, maintenance and documents, then applies local TypeScript logic to suggest what to do next."
      />

      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="flex items-start gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <Bot className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">Free forever mode</p>
            <p className="text-sm text-muted-foreground">
              Everything on this page runs inside your app with normal database queries. It does not call OpenAI, Vercel, GitHub, or any paid plugin at runtime.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Monthly bills" value={formatCurrency(monthlyBills)} icon={Receipt} />
        <StatCard label="Monthly savings plan" value={formatCurrency(monthlySavings)} icon={PiggyBank} accent="muted" />
        <StatCard label="Project pipeline" value={formatCurrency(projectPipeline)} icon={Hammer} />
        <StatCard label="Wishlist value" value={formatCurrency(wishlistValue)} icon={ShoppingBag} accent="muted" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              What to do next
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allClear ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Nothing urgent. Your house admin is calm right now.
              </div>
            ) : (
              <div className="space-y-2">
                {topActions.map((item, index) => (
                  <AssistantRow key={`${item.href}-${index}`} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-primary" />
              This month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ReportLine label="Bills expected" value={formatCurrency(monthlyBills)} />
            <ReportLine label="Savings planned" value={formatCurrency(monthlySavings)} />
            <ReportLine label="Open tasks" value={String(tasks.filter((t) => !t.is_done).length)} />
            <ReportLine label="Active projects" value={String(openProjects.length)} />
            <ReportLine label="Savings progress" value={savingsTarget ? `${savingsProgress}%` : "No target"} />
            {readyToBuy.length ? (
              <p className="rounded-lg bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-300">
                {formatCurrency(readyToBuyValue)} is ready to buy. Consider checking this against savings before purchasing.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Free upgrades this assistant can support later</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <FreeFeature title="Smart checklists" detail="Generate project task suggestions from local templates." />
          <FreeFeature title="Renewal planner" detail="Group expiring documents, bills and maintenance into a monthly plan." />
          <FreeFeature title="Purchase guardrails" detail="Warn when ready-to-buy items exceed a chosen budget threshold." />
        </CardContent>
      </Card>
    </div>
  );
}

function AssistantRow({ item }: { item: AssistantItem }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-accent">
      <span className={toneIconClass(item.tone)}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{item.title}</span>
        <span className="block truncate text-xs text-muted-foreground">{item.detail}</span>
      </span>
      <Badge variant={toneBadge(item.tone)}>{item.tone === "danger" ? "Now" : item.tone === "warning" ? "Soon" : "Plan"}</Badge>
    </Link>
  );
}

function ReportLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b pb-2 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function FreeFeature({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function toneRank(tone: AssistantItem["tone"]) {
  return { danger: 0, warning: 1, neutral: 2, good: 3 }[tone];
}

function toneBadge(tone: AssistantItem["tone"]) {
  if (tone === "danger") return "destructive";
  if (tone === "warning") return "warning";
  if (tone === "good") return "success";
  return "secondary";
}

function toneIconClass(tone: AssistantItem["tone"]) {
  const base = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg";
  if (tone === "danger") return `${base} bg-destructive/10 text-destructive`;
  if (tone === "warning") return `${base} bg-warning/15 text-warning`;
  if (tone === "good") return `${base} bg-success/15 text-success`;
  return `${base} bg-primary/10 text-primary`;
}
