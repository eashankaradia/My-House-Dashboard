import type { PriceProvider } from "./types";

/**
 * Free, no-signup price lookup via Stooq's public CSV endpoint. End-of-day
 * data (not truly real-time) and less official than a paid API, but needs
 * no API key — the right default for a "free integrations only" v1.
 *
 * Ticker format: Stooq wants a market suffix, e.g. "AAPL.US", "VOD.UK".
 */
export const stooqProvider: PriceProvider = {
  name: "stooq",
  async getPrice(ticker: string): Promise<number | null> {
    try {
      const url = `https://stooq.com/q/l/?s=${encodeURIComponent(ticker)}&f=sd2t2ohlcv&h&e=csv`;
      const res = await fetch(url, { next: { revalidate: 300 } });
      if (!res.ok) return null;
      const text = await res.text();
      const lines = text.trim().split("\n");
      if (lines.length < 2) return null;
      const cols = lines[1].split(",");
      // Symbol,Date,Time,Open,High,Low,Close,Volume
      const close = cols[6];
      if (!close || close === "N/D") return null;
      const price = Number(close);
      return Number.isFinite(price) ? price : null;
    } catch {
      return null;
    }
  },
};
