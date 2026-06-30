"use client";

import { usePref } from "@/components/providers/prefs";

/** Default bottom-bar tabs (hrefs), in order. Max 4 around the centre + button. */
export const DEFAULT_BOTTOM_TABS =
  process.env.NEXT_PUBLIC_APP === "life"
    ? ["/dashboard", "/habits", "/fitness", "/journal"]
    : ["/dashboard", "/projects", "/bills", "/rooms"];

/** Per-device ordered list of bottom-bar tab hrefs (null = use defaults). */
export function useBottomTabs() {
  const [tabs, set] = usePref<string[] | null>("bottom-tabs", null);
  return { tabs, save: (next: string[]) => set(next) };
}
