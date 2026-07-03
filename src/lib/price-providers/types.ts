export type PriceProvider = {
  name: string;
  /** Latest price for a ticker, or null if unavailable (unknown ticker, network error, etc). */
  getPrice(ticker: string): Promise<number | null>;
};
