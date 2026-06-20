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
 * cap of 60 years is hit). `extraMonthly` models a regular overpayment.
 */
export function amortise(
  balance: number,
  annualRatePct: number,
  monthlyPayment: number,
  extraMonthly = 0,
): AmortPoint[] {
  const points: AmortPoint[] = [];
  const monthlyRate = annualRatePct / 100 / 12;
  let remaining = balance;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  const payment = monthlyPayment + extraMonthly;

  if (payment <= 0) return points;

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
): number {
  const sim = amortise(balance, annualRatePct, monthlyPayment, extraMonthly);
  return sim.length ? sim[sim.length - 1].month : 0;
}
