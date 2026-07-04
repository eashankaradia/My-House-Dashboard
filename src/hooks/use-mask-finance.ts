"use client";

import { usePref } from "@/components/providers/prefs";

/** Per-device toggle to hide personal finance amounts behind bullets. */
export function useMaskFinance() {
  const [masked, set] = usePref<boolean>("mask-finance", false);
  return { masked, setMasked: (v: boolean) => set(v) };
}
