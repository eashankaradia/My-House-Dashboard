"use client";

import { usePref } from "@/components/providers/prefs";

/** Default bottom-bar tabs (hrefs), in order. */
export const DEFAULT_BOTTOM_TABS = ["/dashboard", "/bills", "/projects", "/inspiration"];

/** Per-device ordered list of bottom-bar tab hrefs (null = use defaults). */
export function useBottomTabs() {
  const [tabs, set] = usePref<string[] | null>("bottom-tabs", null);
  return { tabs, save: (next: string[]) => set(next) };
}
