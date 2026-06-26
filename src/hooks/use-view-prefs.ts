"use client";

import { usePref } from "@/components/providers/prefs";

export type ViewMode = "detailed" | "compact" | "table";

/** Sensible default view per section when the user hasn't chosen one. */
export const DEFAULT_VIEW: Record<string, ViewMode> = {
  purchases: "compact",
  tasks: "detailed",
};

/**
 * Per-device chosen view for a section (e.g. "purchases", "tasks"). The stored
 * value is also the default shown next time, so the Settings picker and the
 * on-page toggle share one source of truth.
 */
export function useViewPref(section: string): [ViewMode, (v: ViewMode) => void] {
  const fallback = DEFAULT_VIEW[section] ?? "compact";
  const [view, set] = usePref<ViewMode>(`view:${section}`, fallback);
  return [view, (v: ViewMode) => set(v)];
}
