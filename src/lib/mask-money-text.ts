export const MASKED_AMOUNT = "••••";

/** Replaces GBP-formatted amounts (e.g. "£1,234.56") within a larger string with a fixed placeholder. */
export function maskMoneyText(text: string): string {
  return text.replace(/-?£[\d,]+(\.\d+)?/g, MASKED_AMOUNT);
}
