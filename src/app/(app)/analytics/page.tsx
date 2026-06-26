import { BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutChart } from "@/components/charts/donut-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { AreaChart } from "@/components/charts/area-chart";
import { formatCurrency, toAnnual, toMonthly } from "@/lib/utils";
import type {
  Bill,
  BillPayment,
  MaintenanceTask,
  Project,
  Purchase,
  SavingsPot,
} from "@/lib/database.types";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const [bills, pots, projects, maintenance, purchases, paymentsRes] = await Promise.all([
    supabase.from("bills").select("*"),
    supabase.from("savings_pots").select("*"),
    supabase.from("projects").select("*"),
    supabase.from("maintenance_tasks").select("*"),
    supabase.from("purchases").select("*"),
    supabase.from("bill_payments").select("*"),
  ]);

  const billRows = (bills.data ?? []) as Bill[];
  const potRows = (pots.data ?? []) as SavingsPot[];
  const projectRows = (projects.data ?? []) as Project[];
  const maintRows = (maintenance.data ?? []) as MaintenanceTask[];
  const purchaseRows = (purchases.data ?? []) as Purchase[];
  // Only count payments actually marked paid — auto-generated due rows are unpaid.
  const payments = ((paymentsRes.data ?? []) as BillPayment[]).filter((p) => p.is_paid);

  const hasData =
    billRows.length + potRows.length + projectRows.length + maintRows.length + purchaseRows.length >
    0;

  if (!hasData) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Trends and breakdowns across your home." info="Visual breakdowns of your spending, savings, projects and maintenance. These charts fill in automatically as you add data in the other sections — there's nothing to enter here." />
        <EmptyState
          icon={BarChart3}
          title="Nothing to analyse yet"
          description="As you add bills, savings, projects and maintenance, this page fills with charts and insights."
        />
      </div>
    );
  }

  // Bills by category (monthly equivalent).
  const billByCat = aggregate(billRows, (b) => b.category, (b) => toMonthly(b.amount, b.frequency));
  const monthlyBills = billRows.reduce((s, b) => s + toMonthly(b.amount, b.frequency), 0);

  // Projected cumulative outgoings over the next 6 months.
  const trend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    return {
      name: d.toLocaleString("en-GB", { month: "short" }),
      value: Math.round(monthlyBills * (i + 1)),
    };
  });

  // Project cost by category.
  const projectByCat = aggregate(
    projectRows,
    (p) => p.category,
    (p) => Number(p.actual_cost) || Number(p.estimated_cost),
  );

  // Savings: current vs target per pot.
  const savingsData = potRows.map((p) => ({ name: p.name, value: Math.round(Number(p.current_amount)) }));

  // Maintenance cost by task.
  const maintData = maintRows
    .map((m) => ({ name: m.task, value: Math.round(Number(m.cost)) }))
    .filter((d) => d.value > 0);

  // Upcoming annual costs: bills + maintenance.
  const annualBills = billRows.reduce((s, b) => s + toAnnual(b.amount, b.frequency), 0);
  const annualMaint = maintRows.reduce((s, m) => s + Number(m.cost), 0);

  // Wishlist value by category.
  const wishlistByCat = aggregate(
    purchaseRows.filter((p) => p.status !== "Purchased"),
    (p) => p.category,
    (p) => Number(p.price),
  );

  // --- Bill payments: trend + expected vs actual (actionable) --------------
  const billName = new Map(billRows.map((b) => [b.id, b.name]));
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleString("en-GB", { month: "short" }) };
  });
  const monthKeys = new Set(months.map((m) => m.key));
  const paidAmount = (p: BillPayment) => Number(p.actual_amount ?? p.expected_amount);
  const windowPayments = payments.filter((p) => monthKeys.has(p.payment_date.slice(0, 7)));
  const totalExpected = windowPayments.reduce((s, p) => s + Number(p.expected_amount), 0);
  const totalActual = windowPayments.reduce((s, p) => s + paidAmount(p), 0);
  const variance = totalActual - totalExpected;
  const paidByMonth = months.map((m) => ({
    name: m.label,
    value: Math.round(payments.filter((p) => p.payment_date.slice(0, 7) === m.key).reduce((s, p) => s + paidAmount(p), 0)),
  }));
  const varByBill = new Map<string, number>();
  for (const p of windowPayments) {
    varByBill.set(p.bill_id, (varByBill.get(p.bill_id) ?? 0) + (paidAmount(p) - Number(p.expected_amount)));
  }
  const biggestVariances = Array.from(varByBill.entries())
    .map(([id, v]) => ({ name: billName.get(id) ?? "Bill", value: v }))
    .filter((x) => Math.abs(x.value) >= 0.005)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 5);
  const hasPayments = payments.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Useful, actionable insight you can learn from." info="Leads with your bill payments — what you've actually paid month to month, and how that compares with what you expected. The breakdowns below fill in automatically from the other sections." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Monthly bills" value={formatCurrency(monthlyBills)} />
        <StatCard label="Annual outgoings" value={formatCurrency(annualBills + annualMaint)} accent="muted" />
        <StatCard label="Total saved" value={formatCurrency(potRows.reduce((s, p) => s + Number(p.current_amount), 0))} />
        <StatCard label="Project pipeline" value={formatCurrency(projectRows.reduce((s, p) => s + Number(p.estimated_cost), 0))} accent="muted" />
      </div>

      {/* Actionable: payments trend + expected vs actual */}
      {hasPayments ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Expected (6 mo)" value={formatCurrency(totalExpected)} />
            <StatCard label="Actually paid (6 mo)" value={formatCurrency(totalActual)} accent="muted" />
            <StatCard
              label={variance > 0 ? "Over expected" : variance < 0 ? "Under expected" : "On budget"}
              value={`${variance > 0 ? "+" : variance < 0 ? "−" : ""}${formatCurrency(Math.abs(variance))}`}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Actually paid by month" show>
              <AreaChart data={paidByMonth} />
            </ChartCard>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Biggest differences vs expected</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {biggestVariances.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Every payment matched what you expected.</p>
                ) : (
                  biggestVariances.map((v) => (
                    <div key={v.name} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">{v.name}</span>
                      <span className={v.value > 0 ? "font-medium text-destructive" : "font-medium text-emerald-600 dark:text-emerald-400"}>
                        {v.value > 0 ? "+" : "−"}
                        {formatCurrency(Math.abs(v.value))}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Log a few bill payments (on the Bills tab) to see what you actually paid vs what you expected, month by month.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Spending by category" show={billByCat.length > 0}>
          <DonutChart data={billByCat} />
        </ChartCard>
        <ChartCard title="Projected cumulative outgoings (6 months)" show={monthlyBills > 0}>
          <AreaChart data={trend} />
        </ChartCard>
        <ChartCard title="Project costs by category" show={projectByCat.length > 0}>
          <BarChart data={projectByCat} multicolor />
        </ChartCard>
        <ChartCard title="Savings by pot" show={savingsData.length > 0}>
          <BarChart data={savingsData} multicolor />
        </ChartCard>
        <ChartCard title="Maintenance spend by task" show={maintData.length > 0}>
          <BarChart data={maintData} multicolor />
        </ChartCard>
        <ChartCard title="Wishlist value by category" show={wishlistByCat.length > 0}>
          <BarChart data={wishlistByCat} multicolor />
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  show,
  children,
}: {
  title: string;
  show: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {show ? children : <p className="py-12 text-center text-sm text-muted-foreground">No data yet.</p>}
      </CardContent>
    </Card>
  );
}

function aggregate<T>(rows: T[], key: (r: T) => string, value: (r: T) => number) {
  const map = new Map<string, number>();
  for (const r of rows) map.set(key(r), (map.get(key(r)) ?? 0) + value(r));
  return Array.from(map.entries())
    .map(([name, v]) => ({ name, value: Math.round(v) }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}
