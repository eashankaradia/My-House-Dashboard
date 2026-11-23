import { ArrowRight, BarChart3, Home, PiggyBank, Receipt, Wallet } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/shared/money";
import { formatDate, daysUntil, toMonthly } from "@/lib/utils";
import type { Bill, BillPayment, Mortgage, SavingsPot } from "@/lib/database.types";

export const metadata = { title: "Money" };

const todayStr = () => new Date().toISOString().slice(0, 10);

export default async function MoneyPage() {
  const supabase = await createClient();
  const isHouse = process.env.NEXT_PUBLIC_APP !== "life";
  let billsQuery = supabase.from("bills").select("*").order("name");
  if (isHouse) billsQuery = billsQuery.eq("scope", "household");

  const [{ data: billData }, { data: paymentData }, { data: potData }, { data: mortgageData }] =
    await Promise.all([
      billsQuery,
      supabase.from("bill_payments").select("*").order("payment_date"),
      supabase.from("savings_pots").select("*").order("created_at"),
      supabase.from("mortgages").select("*").order("created_at").limit(1),
    ]);

  const bills = (billData ?? []) as Bill[];
  const payments = (paymentData ?? []) as BillPayment[];
  const pots = (potData ?? []) as SavingsPot[];
  const mortgage = (mortgageData?.[0] as Mortgage | undefined) ?? undefined;

  const monthlyTotal = bills.reduce((sum, b) => sum + toMonthly(b.amount, b.frequency), 0);
  const saved = pots.reduce((sum, p) => sum + Number(p.current_amount), 0);

  // What actually needs doing: unpaid payments already due, then the next few
  // bills by due date. Everything else lives on the detail pages.
  const today = todayStr();
  const unpaid = payments
    .filter((p) => !p.is_paid && p.payment_date <= today)
    .sort((a, b) => a.payment_date.localeCompare(b.payment_date));
  const billById = new Map(bills.map((b) => [b.id, b]));
  const needsPaying = unpaid
    .map((p) => ({ payment: p, bill: billById.get(p.bill_id) }))
    .filter((x): x is { payment: BillPayment; bill: Bill } => Boolean(x.bill));

  const upcoming = bills
    .filter((b) => b.due_date)
    .map((b) => ({ bill: b, days: daysUntil(b.due_date) ?? 9999 }))
    .filter((x) => x.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);

  const sections = [
    {
      href: "/bills",
      icon: Receipt,
      title: "Bills & expenses",
      // No raw amounts in these strings — they'd bypass the finance-masking
      // toggle, which only applies inside <Money>.
      summary: bills.length
        ? `${bills.length} recurring cost${bills.length === 1 ? "" : "s"}`
        : "Add your recurring costs",
    },
    ...(isHouse
      ? []
      : [{ href: "/finance", icon: Wallet, title: "Income & budgets", summary: "What comes in, and where it goes" }]),
    {
      href: "/savings",
      icon: PiggyBank,
      title: "Savings pots",
      summary: pots.length ? `${pots.length} pot${pots.length === 1 ? "" : "s"}` : "Set a goal to save towards",
    },
    ...(isHouse
      ? [
          {
            href: "/mortgage",
            icon: Home,
            title: "Mortgage",
            summary: mortgage ? "Balance, equity & payoff" : "Add your mortgage details",
          },
          { href: "/analytics", icon: BarChart3, title: "Analytics", summary: "Trends & breakdowns over time" },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Money"
        description="Everything financial in one place."
        info="The numbers at the top are your running monthly cost, what you've saved and what's left on the mortgage. Anything due or overdue appears under Needs paying — tap through to Bills to mark it off. The cards at the bottom open the full detail for each area."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Bills each month" value={<Money value={monthlyTotal} />} hint={`${bills.length} bill${bills.length === 1 ? "" : "s"}`} icon={Receipt} />
        <StatCard label="Saved" value={<Money value={saved} />} hint={`${pots.length} pot${pots.length === 1 ? "" : "s"}`} icon={PiggyBank} />
        {mortgage ? (
          <StatCard label="Mortgage left" value={<Money value={Number(mortgage.mortgage_balance)} />} hint="Outstanding balance" icon={Home} />
        ) : null}
      </div>

      {needsPaying.length > 0 ? (
        <Card className="border-amber-500/40">
          <CardHeader>
            <CardTitle className="text-base">Needs paying ({needsPaying.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {needsPaying.map(({ payment, bill }) => (
              <Link
                key={payment.id}
                href="/bills"
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent/40"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{bill.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {payment.payment_date < today ? "Overdue · " : "Due · "}
                    {formatDate(payment.payment_date)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold">
                  <Money value={payment.actual_amount ?? payment.expected_amount} />
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {upcoming.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coming up</CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {upcoming.map(({ bill, days }) => (
              <div key={bill.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{bill.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`} · {formatDate(bill.due_date)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold">
                  <Money value={bill.amount} />
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm transition-colors hover:bg-accent/40"
          >
            <s.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{s.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{s.summary}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
