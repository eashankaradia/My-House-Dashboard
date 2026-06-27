"use client";

import { usePref } from "@/components/providers/prefs";

/**
 * Secondary dashboard widgets hidden by default, so the dashboard leads with
 * Needs attention + glance + week ahead. Users can switch any back on via
 * "Edit dashboard".
 */
export const DEFAULT_DASHBOARD_HIDDEN = ["reminders", "maintenance", "inspiration", "purchases", "activity"];

/** Per-device preference for which dashboard widgets are hidden. */
export function useDashboardPrefs() {
  const [hidden, set] = usePref<string[]>("dashboard-hidden", DEFAULT_DASHBOARD_HIDDEN);
  const toggle = (id: string) => {
    set(hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id]);
  };
  return { hidden, toggle };
}
