"use client";

import { usePref } from "@/components/providers/prefs";

/** Per-device preference for which sidebar tabs are hidden. */
export function useHiddenTabs() {
  const [hidden, set] = usePref<string[]>("hidden-tabs", []);
  const toggle = (href: string) => {
    set(hidden.includes(href) ? hidden.filter((h) => h !== href) : [...hidden, href]);
  };
  return { hidden, toggle };
}
