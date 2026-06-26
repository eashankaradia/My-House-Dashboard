"use client";

import { usePref } from "@/components/providers/prefs";

/** Default glance stats, in order, when the user hasn't customised. */
export const DEFAULT_GLANCE = ["nextBill", "savingsBalance", "readyToBuy"];

/**
 * Per-device ordered list of glance-stat ids shown on the dashboard. `null`
 * means "use DEFAULT_GLANCE".
 */
export function useGlancePrefs() {
  const [order, set] = usePref<string[] | null>("glance", null);
  return { order, save: (next: string[]) => set(next) };
}
