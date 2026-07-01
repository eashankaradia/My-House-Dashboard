"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, LineChart, PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency, toMonthly } from "@/lib/utils";
import type { Bill, SavingsAccount, SavingsContribution, SavingsPot, Share } from "@/lib/database.types";
import { PotCard } from "@/app/(app)/savings/pot-card";
import { PotForm } from "@/app/(app)/savings/pot-form";

type IncomeSource = "entered" | "carried" | "none";

export function FinanceScope({
  bills,
  pots,
  accounts,
  contributions,
  shares,
  sharePrices,
  monthlyCardStatements,
  monthlyIncome,
  incomeSource,
  currentUserId,
  showFilter,
}: {
  bills: Bill[];
  pots: SavingsPot[];
  accounts: SavingsAccount[];
  contributions: SavingsContribution[];
  shares: Share[];
  sharePrices: Record<string, number | null>;
  monthlyCardStatements: number;
  monthlyIncome: number | null;
  incomeSource: IncomeSource;
  currentUserId: string;
  showFilter: boolean;
}) {
  const [onlyMine, setOnlyMine] = React.useState(showFilter);

  const visibleBills = onlyMine ? bills.filter((b) => b.user_id === currentUserId) : bills;
  const visiblePots = onlyMine ? pots.filter((p) => p.user_id === currentUserId) : pots;
  const savingsPots = visiblePots.filter((p) => (p.pot_type ?? "savings") === "savings");
  const investmentPots = visiblePots.filter((p) => p.pot_type === "investment");

  const monthNow = new Date().toISOString().slice(0, 7);
  const monthlyBills =
    visibleBills.reduce((s, b) => s + toMonthly(Number(b.amount), b.frequency), 0) + monthlyCardStatements;
  const monthlySavings = contributions
    .filter((c) => visiblePots.some((p) => p.id === c.pot_id) && c.occurred_on.startsWith(monthNow) && Number(c.amount) > 0)
    .reduce((s, c) => s + Number(c.amount), 0);
  const netMonthly = monthlyIncome !== null ? monthlyIncome - monthlyBills : null;
  const savingsRate = monthlyIncome && monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 100) : null;

  const totalSaved = savingsPots.reduce((s, p) => s + Number(p.current_amount), 0);
  const totalTarget = savingsPots.reduce((s, p) => s + Number(p.target_amount ?? 0), 0);
  const totalInvested = investmentPots.reduce((s, p) => s + Number(p.current_amount), 0);
  const totalSharesValue = shares.reduce(
    (s, sh) => s + Number(sh.quantity) * (sharePrices[sh.ticker] ?? Number(sh.purchase_price)),
    0,
  );
  const netWorth = totalSaved + totalInvested + totalSharesValue;

  return (
    <div className="space-y-6">
      {showFilter ? (
        <div className="flex items-center justify-end">
          <div className="flex items-center rounded-lg border p-0.5 text-xs">
            <button
              onClick={() => setOnlyMine(false)}
              className={cn("rounded-md px-2.5 py-1", !onlyMine && "bg-accent")}
            >
              Household
            </button>
            <button
              onClick={() => setOnlyMine(true)}
              className={cn("rounded-md px-2.5 py-1", onlyMine && "bg-accent")}
            >
              Mine
            </button>
          </div>
        </div>
      ) : null}

      {/* Key numbers */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Net worth"
          value={formatCurrency(netWorth)}
          hint={`${formatCurrency(totalSaved)} saved + ${formatCurrency(totalInvested + totalSharesValue)} invested`}
          icon={PiggyBank}
        />
        <StatCard
          label="Monthly income"
          value={monthlyIncome !== null ? formatCurrency(monthlyIncome) : "Not set"}
          hint={
            incomeSource === "entered"
              ? "Logged this month"
              : incomeSource === "carried"
                ? "Carried from last entry"
                : "Add it in Income below"
          }
          icon={Wallet}
          accent={monthlyIncome === null ? "muted" : undefined}
        />
        <StatCard
          label="Monthly bills"
          value={formatCurrency(monthlyBills)}
          hint={`${visibleBills.length} recurring cost${visibleBills.length === 1 ? "" : "s"}${monthlyCardStatements ? " + cards" : ""}`}
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

      {/* Savings pots */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Savings pots</CardTitle>
          <div className="flex items-center gap-2">
            <PotForm
              defaultPotType="savings"
              trigger={<button className="text-sm font-medium text-primary hover:underline">New pot</button>}
            />
            <Link href="/savings" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {savingsPots.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No savings pots yet.</p>
          ) : (
            <>
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
              <div className="grid gap-4 sm:grid-cols-2">
                {savingsPots.slice(0, 4).map((pot) => (
                  <PotCard
                    key={pot.id}
                    pot={pot}
                    accounts={accounts.filter((a) => a.pot_id === pot.id)}
                    contributions={contributions.filter((c) => c.pot_id === pot.id)}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Investment pots */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-4 w-4 text-muted-foreground" /> Investment pots
          </CardTitle>
          <div className="flex items-center gap-2">
            <PotForm
              defaultPotType="investment"
              trigger={<button className="text-sm font-medium text-primary hover:underline">New pot</button>}
            />
            <Link href="/savings" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {investmentPots.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No investment pots yet.</p>
          ) : (
            <>
              <div>
                <p className="text-xs text-muted-foreground">Total invested</p>
                <p className="text-xl font-semibold">{formatCurrency(totalInvested)}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {investmentPots.slice(0, 4).map((pot) => (
                  <PotCard
                    key={pot.id}
                    pot={pot}
                    accounts={accounts.filter((a) => a.pot_id === pot.id)}
                    contributions={contributions.filter((c) => c.pot_id === pot.id)}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
