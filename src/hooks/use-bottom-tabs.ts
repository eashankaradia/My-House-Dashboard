"use client";

import { usePref } from "@/components/providers/prefs";

/** Default bottom-bar tabs (hrefs), in order. Max 4 around the centre + button. */
export const DEFAULT_BOTTOM_TABS = ["/dashboard", "/bills", "/fitness", "/habits"];

/** Per-device ordered list of bottom-bar tab hrefs (null = use defaults). */
export function useBottomTabs() {
  const [tabs, set] = usePref<string[] | null>("bottom-tabs", null);
  return { tabs, save: (next: string[]) => set(next) };
}
