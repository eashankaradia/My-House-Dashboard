import { describe, expect, it } from "vitest";
import { amortise, payoffMonths, monthsToYearsLabel } from "./finance";

describe("amortise", () => {
  it("pays off a simple loan and reduces the balance to zero", () => {
    const sim = amortise(100_000, 4, 600);
    expect(sim.length).toBeGreaterThan(0);
    expect(sim[sim.length - 1].balance).toBe(0);
  });

  it("returns no schedule when the payment can't cover the interest", () => {
    // 5% on 100k is ~417/mo interest; paying 100 never clears it.
    expect(amortise(100_000, 5, 100)).toHaveLength(0);
  });

  it("a regular overpayment shortens the term", () => {
    const base = payoffMonths(100_000, 4, 600, 0);
    const faster = payoffMonths(100_000, 4, 600, 200);
    expect(faster).toBeLessThan(base);
  });

  it("a one-off lump sum shortens the term", () => {
    const base = payoffMonths(100_000, 4, 600, 0, 0);
    const withLump = payoffMonths(100_000, 4, 600, 0, 20_000);
    expect(withLump).toBeLessThan(base);
  });

  it("clears immediately when the lump sum covers the balance", () => {
    expect(payoffMonths(10_000, 4, 500, 0, 10_000)).toBe(0);
  });
});

describe("monthsToYearsLabel", () => {
  it("formats years and months", () => {
    expect(monthsToYearsLabel(25)).toBe("2y 1m");
    expect(monthsToYearsLabel(12)).toBe("1y");
    expect(monthsToYearsLabel(0)).toBe("—");
  });
});
