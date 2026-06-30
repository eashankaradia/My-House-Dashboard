import Link from "next/link";
import { ArrowRight, PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, toMonthly } from "@/lib/utils";
import type { Bill, Budget, FinanceSettings, Goal, SavingsPot } from "@/lib/database.types";
import { IncomeForm } from "./income-form";
import { BudgetForm } from "./budget-form";
import { BILL_CATEGORIES } from "@/lib/constants";

export const metadata = { title: "Finance" };

export default async function FinancePage() {
  const supabase = await createClient();
  const [billsRes, settingsRes, budgetsRes, potsRes, goalsRes] = await Promise.all([
    supabase.from("bills").select("*"),
    supabase.from("finance_settings").select("*").limit(1).maybeSingle(),
    supabase.from("budgets").select("*").order("category"),
    supabase.from("savings_pots").select("*").order("created_at"),
    supabase.from("goals").select("*").eq("status", "Active").eq("category", "Financial"),
  ]);

  const bills = (billsRes.data ?? []) as Bill[];
  const settings = settingsRes.data as FinanceSettings | null;
  const budgets = (budgetsRes.data ?? []) as Budget[];
  const pots = (potsRes.data ?? []) as SavingsPot[];
  const financialGoals = (goalsRes.data ?? []) as Goal[];

  const monthlyIncome = settings?.monthly_income ? Number(settings.monthly_income) : null;
  const monthlyBills = bills.reduce((s, b) => s + toMonthly(Number(b.amount), b.frequency), 0);
  const monthlySavings = pots.reduce((s, p) => s + Number(p.monthly_contribution ?? 0), 0);
  const netMonthly = monthlyIncome !== null ? monthlyIncome - monthlyBills : null;
  const savingsRate =
    monthlyIncome && monthlyIncome > 0
      ? Math.round((monthlySavings / monthlyIncome) * 100)
      : null;

  // Group bills by category for the budget comparison
  const spendByCategory = new Map<string, number>();
  for (const b of bills) {
    const key = b.category;
    spendByCategory.set(key, (spendByCategory.get(key) ?? 0) + toMonthly(Number(b.amount), b.frequency));
  }

  // Build all categories that have either bills or a budget
  const allCategories = Array.from(
    new Set([
      ...Array.from(spendByCategory.keys()),
      ...budgets.map((b) => b.category),
    ]),
  ).sort();

  const budgetByCategory = new Map(budgets.map((b) => [b.category, b]));

  // Sort BILL_CATEGORIES first, then others alphabetically
  const billCatSet = new Set<string>(BILL_CATEGORIES);
  const orderedCategories = [
    ...allCategories.filter((c) => billCatSet.has(c)),
    ...allCategories.filter((c) => !billCatSet.has(c)),
  ];

  const totalSaved = pots.reduce((s, p) => s + Number(p.current_amount), 0);
  const totalTarget = pots.reduce((s, p) => s + Number(p.target_amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Your personal financial overview."
        info="Set your monthly income to calculate your net position and savings rate. Add budgets per category to track spending against your bills."
      >
        <IncomeForm settings={settings} />
      </PageHeader>

      {/* Key numbers */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={settings?.income_label ?? "Monthly income"}
          value={monthlyIncome !== null ? formatCurrency(monthlyIncome) : "Not set"}
          hint={monthlyIncome !== null ? "Take-home pay" : "Tap 'Set income' above"}
          icon={Wallet}
          accent={monthlyIncome === null ? "muted" : undefined}
        />
        <StatCard
          label="Monthly bills"
          value={formatCurrency(monthlyBills)}
          hint={`${bills.length} recurring cost${bills.length === 1 ? "" : "s"}`}
          icon={TrendingDown}
          accent="muted"
        />
        <StatCard
          label="Net monthly"
          value={netMonthly !== null ? formatCurrency(netMonthly) : "—"}
          hint={netMonthly !== null ? (netMonthly >= 0 ? "After bills" : "Over budget") : "Set income to calculate"}
          icon={netMonthly !== null && netMonthly < 0 ? TrendingDown : TrendingUp}
          accent={netMonthly === null ? "muted" : netMonthly < 0 ? "destructive" : undefined}
        />
        <StatCard
          label="Savings rate"
          value={savingsRate !== null ? `${savingsRate}%` : "—"}
          hint={savingsRate !== null ? `${formatCurrency(monthlySavings)}/mo saved` : "Set income to calculate"}
          icon={PiggyBank}
          accent="muted"
        />
      </div>

      {/* Budget vs actual */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Budget vs actual</CardTitle>
          <BudgetForm />
        </CardHeader>
        <CardContent>
          {orderedCategories.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Add bills and budgets to see your spending here.
            </p>
          ) : (
            <div className="divide-y">
              {orderedCategories.map((cat) => {
                const actual = Math.round(spendByCategory.get(cat) ?? 0);
                const budget = budgetByCategory.get(cat);
                const limit = budget ? Number(budget.monthly_limit) : null;
                const pct = limit && limit > 0 ? Math.min(100, Math.round((actual / limit) * 100)) : null;
                const overBudget = pct !== null && pct >= 100;
                const nearLimit = pct !== null && pct >= 80 && pct < 100;

                return (
                  <div key={cat} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{cat}</span>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-sm tabular-nums">
                            {formatCurrency(actual)}
                            {limit !== null && (
                              <span className="text-muted-foreground"> / {formatCurrency(limit)}</span>
                            )}
                          </span>
                          {overBudget && <Badge variant="destructive">Over</Badge>}
                          {nearLimit && <Badge variant="warning">Near</Badge>}
                          {!limit && <span className="text-xs text-muted-foreground">No budget</span>}
                        </div>
                      </div>
                      {pct !== null && (
                        <Progress
                          value={pct}
                          className={`h-1.5 ${overBudget ? "[&>div]:bg-destructive" : nearLimit ? "[&>div]:bg-amber-500" : ""}`}
                        />
                      )}
                    </div>
                    <BudgetForm
                      budget={budget}
                      defaultCategory={cat}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Savings overview */}
      {pots.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Savings pots</CardTitle>
            <Link href="/savings" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Total saved</p>
                <p className="text-xl font-semibold">{formatCurrency(totalSaved)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Target</p>
                <p className="text-xl font-semibold">{totalTarget > 0 ? formatCurrency(totalTarget) : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monthly contributions</p>
                <p className="text-xl font-semibold">{formatCurrency(monthlySavings)}</p>
              </div>
            </div>

            {pots.length > 0 && (
              <div className="divide-y">
                {pots.slice(0, 5).map((pot) => {
                  const current = Number(pot.current_amount);
                  const target = Number(pot.target_amount ?? 0);
                  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : null;
                  return (
                    <div key={pot.id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate font-medium">{pot.name}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {formatCurrency(current)}{target > 0 ? ` / ${formatCurrency(target)}` : ""}
                          </span>
                        </div>
                        {pct !== null && <Progress value={pct} className="h-1.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Financial goals */}
      {financialGoals.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Financial goals</CardTitle>
            <Link href="/goals" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              All goals <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="divide-y">
            {financialGoals.map((goal) => {
              const pct =
                goal.target_value && goal.current_value
                  ? Math.min(100, Math.round((Number(goal.current_value) / Number(goal.target_value)) * 100))
                  : null;
              return (
                <div key={goal.id} className="space-y-1.5 py-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate font-medium">{goal.title}</span>
                    {pct !== null ? (
                      <span className="shrink-0 text-xs text-muted-foreground">{pct}%</span>
                    ) : null}
                  </div>
                  {pct !== null && <Progress value={pct} className="h-1.5" />}
                  {goal.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{goal.description}</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/bills", label: "Bills & Expenses", sub: "Manage recurring costs" },
          { href: "/savings", label: "Savings Pots", sub: "Track your saving goals" },
          { href: "/analytics", label: "Analytics", sub: "Charts & spending trends" },
        ].map(({ href, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-accent"
          >
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
