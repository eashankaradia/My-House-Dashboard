"use client";

import * as React from "react";

const KEY = "mhd:dashboard-hidden";
const EVENT = "mhd:dashboard-hidden-changed";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * Per-device preference for which dashboard widgets are hidden. Stored in
 * localStorage and synced across components via a custom event.
 */
export function useDashboardPrefs() {
  const [hidden, setHidden] = React.useState<string[]>([]);

  React.useEffect(() => {
    setHidden(read());
    const sync = () => setHidden(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = React.useCallback((id: string) => {
    const next = read();
    const idx = next.indexOf(id);
    if (idx >= 0) next.splice(idx, 1);
    else next.push(id);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { hidden, toggle };
}
