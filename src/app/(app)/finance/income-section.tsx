"use client";

import { Wallet, History } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { monthStr } from "@/lib/income";
import type { FinanceSettings, IncomeMonth } from "@/lib/database.types";
import { SalaryDetails } from "./salary-details";
import { IncomeMonthForm } from "./income-month-form";

export function IncomeSection({ settings, months }: { settings: FinanceSettings | null; months: IncomeMonth[] }) {
  const thisMonth = monthStr();
  const sorted = [...months].sort((a, b) => (a.month < b.month ? 1 : -1));
  const hasCurrent = sorted.some((m) => m.month === thisMonth);
  const carried = !hasCurrent ? sorted.find((m) => m.month < thisMonth) : null;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Wallet className="h-3.5 w-3.5" /> Fixed details
        </p>
        <SalaryDetails settings={settings} />
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <History className="h-3.5 w-3.5" /> Monthly net income
        </p>

        {!hasCurrent && (
          <IncomeMonthForm
            month={thisMonth}
            defaultNet={carried ? Number(carried.net_income) : undefined}
            trigger={
              <button className="flex w-full items-center justify-between rounded-lg border border-dashed px-3 py-2.5 text-left text-sm">
                <span>
                  <span className="font-medium">This month</span>{" "}
                  <span className="text-muted-foreground">
                    {carried ? `— carried from ${formatMonth(carried.month)}, tap to confirm` : "— not entered yet, tap to add"}
                  </span>
                </span>
                <span className="font-semibold">{carried ? formatCurrency(Number(carried.net_income)) : "—"}</span>
              </button>
            }
          />
        )}

        <div className="space-y-1">
          {sorted.slice(0, 12).map((m) => (
            <IncomeMonthForm
              key={m.id}
              month={m.month}
              entry={m}
              trigger={
                <button className="flex w-full items-center justify-between rounded-lg border bg-card px-3 py-2.5 text-left text-sm">
                  <span className="font-medium">{formatMonth(m.month)}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold">{formatCurrency(Number(m.net_income))}</span>
                    {Number(m.bonus) > 0 && <span className="text-xs text-emerald-600">+{formatCurrency(Number(m.bonus))} bonus</span>}
                  </span>
                </button>
              }
            />
          ))}
          {sorted.length === 0 && <p className="text-sm text-muted-foreground">No income logged yet.</p>}
        </div>
      </div>
    </div>
  );
}

function formatMonth(m: string): string {
  return new Date(m + "T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
