import type { PriceProvider } from "./types";
import { stooqProvider } from "./stooq";

export type { PriceProvider };

/**
 * The active price provider. Swap this out (or branch on an env var) to
 * change where live share prices come from — nothing else in the app
 * should import a specific provider directly.
 */
export function getPriceProvider(): PriceProvider {
  return stooqProvider;
}

/** Fetch prices for multiple tickers in parallel, tolerating individual failures. */
export async function getPrices(tickers: string[]): Promise<Record<string, number | null>> {
  const provider = getPriceProvider();
  const unique = Array.from(new Set(tickers));
  const results = await Promise.all(unique.map((t) => provider.getPrice(t)));
  const map: Record<string, number | null> = {};
  unique.forEach((t, i) => {
    map[t] = results[i];
  });
  return map;
}
