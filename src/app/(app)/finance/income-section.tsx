"use client";

import { formatCurrency } from "@/lib/utils";
import { monthStr } from "@/lib/income";
import type { FinanceSettings, IncomeMonth } from "@/lib/database.types";
import { SalaryDetails } from "./salary-details";
import { IncomeMonthForm } from "./income-month-form";

export function IncomeSection({ settings, months }: { settings: FinanceSettings | null; months: IncomeMonth[] }) {
  const thisMonth = monthStr();
  const sorted = [...months].sort((a, b) => (a.month < b.month ? 1 : -1));
  const current = sorted.find((m) => m.month === thisMonth);
  const carried = !current ? sorted.find((m) => m.month < thisMonth) : null;
  const history = sorted.filter((m) => m.month !== thisMonth);

  return (
    <div className="space-y-3">
      <SalaryDetails settings={settings} />

      <div className="border-t pt-3">
        <IncomeMonthForm
          month={thisMonth}
          entry={current}
          defaultNet={carried ? Number(carried.net_income) : undefined}
          trigger={
            <button className="flex w-full items-center justify-between rounded-lg border bg-card px-3 py-2.5 text-left text-sm">
              <span>
                <span className="font-medium">This month</span>{" "}
                {!current && carried ? (
                  <span className="text-muted-foreground">— carried, tap to confirm</span>
                ) : !current ? (
                  <span className="text-muted-foreground">— tap to add</span>
                ) : null}
              </span>
              <span className="font-semibold">
                {current
                  ? formatCurrency(Number(current.net_income))
                  : carried
                    ? formatCurrency(Number(carried.net_income))
                    : "—"}
              </span>
            </button>
          }
        />
      </div>

      {history.length > 0 ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">History ({history.length})</summary>
          <div className="mt-2 space-y-1">
            {history.slice(0, 24).map((m) => (
              <IncomeMonthForm
                key={m.id}
                month={m.month}
                entry={m}
                trigger={
                  <button className="flex w-full items-center justify-between rounded-lg border bg-card px-3 py-2 text-left text-sm">
                    <span>{formatMonth(m.month)}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(Number(m.net_income))}</span>
                      {Number(m.bonus) > 0 && <span className="text-xs text-emerald-600">+{formatCurrency(Number(m.bonus))}</span>}
                    </span>
                  </button>
                }
              />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function formatMonth(m: string): string {
  return new Date(m + "T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
