"use client";

import { usePref } from "@/components/providers/prefs";

/** Per-device preference for which dashboard widgets are hidden. */
export function useDashboardPrefs() {
  const [hidden, set] = usePref<string[]>("dashboard-hidden", []);
  const toggle = (id: string) => {
    set(hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id]);
  };
  return { hidden, toggle };
}
