"use client";

import { usePref } from "@/components/providers/prefs";

/** Default bottom-bar tabs (hrefs), in order. Max 4 around the centre + button. */
// Defaults track what actually gets used: Essentials is MyLife's busiest
// page, and Bills is now reached through Money.
export const DEFAULT_BOTTOM_TABS =
  process.env.NEXT_PUBLIC_APP === "life"
    ? ["/dashboard", "/essentials", "/money", "/projects"]
    : ["/dashboard", "/money", "/purchases", "/projects"];

/** Per-device ordered list of bottom-bar tab hrefs (null = use defaults). */
export function useBottomTabs() {
  const [tabs, set] = usePref<string[] | null>("bottom-tabs", null);
  return { tabs, save: (next: string[]) => set(next) };
}
