"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, LineChart, Pencil, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardTrigger } from "@/components/shared/card-trigger";
import { cn, formatCurrency, toMonthly } from "@/lib/utils";
import type { Bill, SavingsAccount, SavingsContribution, SavingsPot, Share } from "@/lib/database.types";
import { PotDetailDialog } from "@/app/(app)/savings/pot-detail";
import { PotForm } from "@/app/(app)/savings/pot-form";
import { QuickContribute } from "@/app/(app)/savings/quick-contribute";

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
  last12MonthsIncome,
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
  last12MonthsIncome: number;
  incomeSource: IncomeSource;
  currentUserId: string;
  showFilter: boolean;
}) {
  const [onlyMine, setOnlyMine] = React.useState(showFilter);

  const visibleBills = onlyMine ? bills.filter((b) => b.user_id === currentUserId) : bills;
  const visiblePots = onlyMine ? pots.filter((p) => p.user_id === currentUserId) : pots;
  const savingsPots = visiblePots.filter((p) => (p.pot_type ?? "savings") === "savings");
  const investmentPots = visiblePots.filter((p) => p.pot_type === "investment");

  const monthlyBills =
    visibleBills.reduce((s, b) => s + toMonthly(Number(b.amount), b.frequency), 0) + monthlyCardStatements;
  const netMonthly = monthlyIncome !== null ? monthlyIncome - monthlyBills : null;

  const totalSaved = savingsPots.reduce((s, p) => s + Number(p.current_amount), 0);
  const totalInvested = investmentPots.reduce((s, p) => s + Number(p.current_amount), 0);
  const totalSharesValue = shares.reduce(
    (s, sh) => s + Number(sh.quantity) * (sharePrices[sh.ticker] ?? Number(sh.purchase_price)),
    0,
  );
  const netWorth = totalSaved + totalInvested + totalSharesValue;

  return (
    <div className="space-y-4">
      {showFilter ? (
        <div className="flex items-center justify-end">
          <div className="flex items-center rounded-lg border p-0.5 text-xs">
            <button onClick={() => setOnlyMine(false)} className={cn("rounded-md px-2.5 py-1", !onlyMine && "bg-accent")}>
              Household
            </button>
            <button onClick={() => setOnlyMine(true)} className={cn("rounded-md px-2.5 py-1", onlyMine && "bg-accent")}>
              Mine
            </button>
          </div>
        </div>
      ) : null}

      {/* Compact key-numbers strip — one card instead of five */}
      <Card>
        <CardContent className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Net worth</p>
            <p className="text-2xl font-semibold">{formatCurrency(netWorth)}</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <MiniStat
              label="Income"
              value={monthlyIncome !== null ? formatCurrency(monthlyIncome) : "Not set"}
              muted={monthlyIncome === null}
            />
            <MiniStat label="Bills" value={formatCurrency(monthlyBills)} muted />
            <MiniStat
              label="Net"
              value={netMonthly !== null ? formatCurrency(netMonthly) : "—"}
              destructive={netMonthly !== null && netMonthly < 0}
            />
            <MiniStat label="Net income (12mo)" value={formatCurrency(last12MonthsIncome)} muted />
          </div>
        </CardContent>
      </Card>

      {/* Savings pots */}
      <Card>
        <PotSectionHeader title={`Savings · ${formatCurrency(totalSaved)}`} defaultPotType="savings" />
        <CardContent className="space-y-1">
          {savingsPots.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">No savings pots yet.</p>
          ) : (
            savingsPots.map((pot) => (
              <CompactPotRow
                key={pot.id}
                pot={pot}
                accounts={accounts.filter((a) => a.pot_id === pot.id)}
                contributions={contributions.filter((c) => c.pot_id === pot.id)}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Investment pots */}
      <Card>
        <PotSectionHeader
          title={
            <span className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-muted-foreground" /> Investments · {formatCurrency(totalInvested)}
            </span>
          }
          defaultPotType="investment"
        />
        <CardContent className="space-y-1">
          {investmentPots.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">No investment pots yet.</p>
          ) : (
            investmentPots.map((pot) => (
              <CompactPotRow
                key={pot.id}
                pot={pot}
                accounts={accounts.filter((a) => a.pot_id === pot.id)}
                contributions={contributions.filter((c) => c.pot_id === pot.id)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** A pot section's header: title, plus "New pot" tucked behind an Edit toggle so the default view stays glanceable. */
function PotSectionHeader({ title, defaultPotType }: { title: React.ReactNode; defaultPotType: "savings" | "investment" }) {
  const [editMode, setEditMode] = React.useState(false);
  return (
    <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-base">{title}</CardTitle>
      <div className="flex items-center gap-2">
        {editMode ? (
          <PotForm
            defaultPotType={defaultPotType}
            trigger={<button className="text-sm font-medium text-primary hover:underline">New</button>}
          />
        ) : null}
        <button
          type="button"
          onClick={() => setEditMode((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground",
            editMode && "bg-accent text-foreground",
          )}
        >
          <Pencil className="h-3.5 w-3.5" /> {editMode ? "Done" : "Edit"}
        </button>
        <Link href="/savings" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </CardHeader>
  );
}

function MiniStat({ label, value, muted, destructive }: { label: string; value: string; muted?: boolean; destructive?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold", muted && "text-muted-foreground", destructive && "text-destructive")}>{value}</p>
    </div>
  );
}

const COLOR_BG: Record<string, string> = {
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  teal: "bg-teal-500",
  indigo: "bg-indigo-500",
  orange: "bg-orange-500",
};

/** Just name + value — full pot management (edit, contribute, delete) lives on /savings. */
function CompactPotRow({
  pot,
  accounts,
  contributions,
}: {
  pot: SavingsPot;
  accounts: SavingsAccount[];
  contributions: SavingsContribution[];
}) {
  return (
    <div className="flex items-center gap-1">
      <PotDetailDialog pot={pot} accounts={accounts} contributions={contributions}>
        <CardTrigger className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-accent">
          <span className="flex min-w-0 items-center gap-2">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", COLOR_BG[pot.color] ?? "bg-primary")} />
            <span className="truncate text-sm font-medium">{pot.name}</span>
          </span>
          <span className="shrink-0 text-sm font-semibold">{formatCurrency(pot.current_amount)}</span>
        </CardTrigger>
      </PotDetailDialog>
      <QuickContribute
        pot={pot}
        trigger={
          <button
            type="button"
            aria-label={`Add to ${pot.name}`}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
          </button>
        }
      />
    </div>
  );
}
