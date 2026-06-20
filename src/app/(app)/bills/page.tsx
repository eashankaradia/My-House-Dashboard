import { AlertTriangle, CalendarClock, Pencil, Receipt, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DonutChart } from "@/components/charts/donut-chart";
import { formatCurrency, formatDate, daysUntil, toAnnual, toMonthly } from "@/lib/utils";
import { FREQUENCY_LABELS } from "@/lib/constants";
import type { Bill } from "@/lib/database.types";
import { BillForm } from "./bill-form";
import { deleteBill } from "./actions";

export const metadata = { title: "Bills & Expenses" };

export default async function BillsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bills")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  const bills = (data ?? []) as Bill[];

  const monthlyTotal = bills.reduce((sum, b) => sum + toMonthly(b.amount, b.frequency), 0);
  const annualTotal = bills.reduce((sum, b) => sum + toAnnual(b.amount, b.frequency), 0);

  // Category breakdown by monthly equivalent.
  const byCategory = new Map<string, number>();
  for (const b of bills) {
    byCategory.set(b.category, (byCategory.get(b.category) ?? 0) + toMonthly(b.amount, b.frequency));
  }
  const categoryData = Array.from(byCategory.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  // Upcoming & overdue.
  const withDue = bills
    .filter((b) => b.due_date)
    .map((b) => ({ bill: b, days: daysUntil(b.due_date) ?? 9999 }))
    .sort((a, b) => a.days - b.days);
  const overdue = withDue.filter((x) => x.days < 0);
  const upcoming = withDue.filter((x) => x.days >= 0).slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader title="Bills & Expenses" description="Every recurring household cost in one place." info="Add each bill with its amount and how often it's paid (weekly, monthly, etc.). We convert everything to true monthly and annual totals, chart it by category, and flag bills that are due soon or overdue. Add a due date to power those reminders.">
        <BillForm />
      </PageHeader>

      {bills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No bills yet"
          description="Add your recurring costs — mortgage, utilities, subscriptions — to see your true monthly and annual spend."
        >
          <BillForm />
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Monthly bills" value={formatCurrency(monthlyTotal)} icon={Receipt} />
            <StatCard label="Annual bills" value={formatCurrency(annualTotal)} icon={TrendingUp} />
            <StatCard
              label="Next due"
              value={upcoming[0] ? formatDate(upcoming[0].bill.due_date) : "—"}
              hint={upcoming[0]?.bill.name}
              icon={CalendarClock}
              accent="muted"
            />
            <StatCard
              label="Overdue"
              value={String(overdue.length)}
              hint={overdue.length ? "Needs attention" : "All up to date"}
              icon={AlertTriangle}
              accent={overdue.length ? "destructive" : "muted"}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Spending by category</CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart data={categoryData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming payments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overdue.concat(upcoming).slice(0, 7).map(({ bill, days }) => (
                  <div key={bill.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{bill.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(bill.due_date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(bill.amount)}</span>
                      {days < 0 ? (
                        <Badge variant="destructive">{Math.abs(days)}d late</Badge>
                      ) : days <= 7 ? (
                        <Badge variant="warning">{days}d</Badge>
                      ) : null}
                    </div>
                  </div>
                ))}
                {overdue.length + upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No dated bills yet.</p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All bills</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {bills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{bill.name}</p>
                      <Badge variant="secondary">{bill.category}</Badge>
                      {!bill.is_fixed ? <Badge variant="outline">Variable</Badge> : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {FREQUENCY_LABELS[bill.frequency]}
                      {bill.payment_account ? ` · ${bill.payment_account}` : ""}
                      {bill.due_date ? ` · due ${formatDate(bill.due_date)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(bill.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(toMonthly(bill.amount, bill.frequency))}/mo
                      </p>
                    </div>
                    <BillForm
                      bill={bill}
                      trigger={
                        <button className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                          <span className="sr-only">Edit</span>
                          <Pencil className="h-4 w-4" />
                        </button>
                      }
                    />
                    <ConfirmDelete itemLabel="bill" action={deleteBill.bind(null, bill.id)} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
