"use client";

import { useMaskFinance } from "@/hooks/use-mask-finance";
import { MASKED_AMOUNT } from "@/lib/mask-money-text";
import { formatCurrency } from "@/lib/utils";

/** Renders a currency amount, replaced with bullets when "Hide finance numbers" is on. */
export function Money({
  value,
  options,
}: {
  value: number | null | undefined;
  options?: Intl.NumberFormatOptions;
}) {
  const { masked } = useMaskFinance();
  if (masked) return <span aria-label="Amount hidden">{MASKED_AMOUNT}</span>;
  return <>{formatCurrency(value, options)}</>;
}
