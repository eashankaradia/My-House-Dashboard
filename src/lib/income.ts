import type { IncomeMonth } from "@/lib/database.types";

/** First-of-month date string for a given date, e.g. "2026-06-01". */
export function monthStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export type EffectiveIncome = {
  net: number;
  bonus: number;
  /** "entered" = explicitly saved for this month, "carried" = filled from the most recent prior month, "none" = nothing logged yet. */
  source: "entered" | "carried" | "none";
  fromMonth?: string;
};

/**
 * The income to use for a given month: an explicit entry if one exists,
 * otherwise the most recent prior month's net income carried forward
 * (bonuses never carry forward — they're a one-off per month).
 */
export function effectiveIncomeForMonth(rows: IncomeMonth[], month: string): EffectiveIncome {
  const exact = rows.find((r) => r.month === month);
  if (exact) return { net: Number(exact.net_income), bonus: Number(exact.bonus), source: "entered" };

  const prior = rows.filter((r) => r.month < month).sort((a, b) => (a.month < b.month ? 1 : -1))[0];
  if (prior) return { net: Number(prior.net_income), bonus: 0, source: "carried", fromMonth: prior.month };

  return { net: 0, bonus: 0, source: "none" };
}
