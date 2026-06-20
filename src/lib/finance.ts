// Mortgage amortisation helpers (pure functions, used on client & server).

export type AmortPoint = {
  month: number;
  year: number;
  balance: number;
  interestPaid: number;
  principalPaid: number;
};

/**
 * Simulate a repayment mortgage month by month until it is paid off (or a hard
 * cap of 60 years is hit). `extraMonthly` models a regular overpayment and
 * `lumpSum` models a single one-off overpayment applied at the start.
 */
export function amortise(
  balance: number,
  annualRatePct: number,
  monthlyPayment: number,
  extraMonthly = 0,
  lumpSum = 0,
): AmortPoint[] {
  const points: AmortPoint[] = [];
  const monthlyRate = annualRatePct / 100 / 12;
  let remaining = Math.max(0, balance - Math.max(0, lumpSum));
  let cumulativeInterest = 0;
  let cumulativePrincipal = Math.max(0, Math.min(lumpSum, balance));
  const payment = monthlyPayment + extraMonthly;

  if (payment <= 0) return points;
  if (remaining <= 0) {
    return [{ month: 0, year: 0, balance: 0, interestPaid: 0, principalPaid: cumulativePrincipal }];
  }

  for (let month = 1; month <= 720 && remaining > 0; month++) {
    const interest = remaining * monthlyRate;
    let principal = payment - interest;

    // Payment can't cover the interest → loan never clears.
    if (principal <= 0) break;

    if (principal > remaining) principal = remaining;
    remaining -= principal;
    cumulativeInterest += interest;
    cumulativePrincipal += principal;

    if (month % 12 === 0 || remaining <= 0) {
      points.push({
        month,
        year: Math.ceil(month / 12),
        balance: Math.max(0, Math.round(remaining)),
        interestPaid: Math.round(cumulativeInterest),
        principalPaid: Math.round(cumulativePrincipal),
      });
    }
  }

  return points;
}

export function monthsToYearsLabel(months: number): string {
  if (!Number.isFinite(months) || months <= 0) return "—";
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y ? `${y}y` : null, m ? `${m}m` : null].filter(Boolean).join(" ") || "0m";
}

/** Number of months until a repayment mortgage is cleared. */
export function payoffMonths(
  balance: number,
  annualRatePct: number,
  monthlyPayment: number,
  extraMonthly = 0,
  lumpSum = 0,
): number {
  const sim = amortise(balance, annualRatePct, monthlyPayment, extraMonthly, lumpSum);
  return sim.length ? sim[sim.length - 1].month : 0;
}
