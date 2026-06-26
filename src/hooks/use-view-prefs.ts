"use client";

import * as React from "react";

const PREFIX = "mhd:view:";
const EVENT = "mhd:view-changed";

export type ViewMode = "detailed" | "compact" | "table";

/** Sensible default view per section when the user hasn't chosen one. */
export const DEFAULT_VIEW: Record<string, ViewMode> = {
  purchases: "compact",
  tasks: "detailed",
};

function read(section: string): ViewMode | null {
  if (typeof window === "undefined") return null;
  try {
    return (window.localStorage.getItem(PREFIX + section) as ViewMode) || null;
  } catch {
    return null;
  }
}

/**
 * Per-device chosen view for a section (e.g. "purchases", "tasks"). The stored
 * value is also the default shown next time, so the Settings picker and the
 * on-page toggle share one source of truth.
 */
export function useViewPref(section: string): [ViewMode, (v: ViewMode) => void] {
  const fallback = DEFAULT_VIEW[section] ?? "compact";
  const [view, setView] = React.useState<ViewMode>(fallback);

  React.useEffect(() => {
    const sync = () => setView(read(section) ?? fallback);
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [section, fallback]);

  const update = React.useCallback(
    (v: ViewMode) => {
      window.localStorage.setItem(PREFIX + section, v);
      window.dispatchEvent(new Event(EVENT));
      setView(v);
    },
    [section],
  );

  return [view, update];
}
