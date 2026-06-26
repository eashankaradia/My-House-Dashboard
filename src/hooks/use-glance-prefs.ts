"use client";

import * as React from "react";

const KEY = "mhd:glance-stats";
const EVENT = "mhd:glance-stats-changed";

/** Default glance stats, in order, when the user hasn't customised. */
export const DEFAULT_GLANCE = ["nextBill", "savingsBalance", "readyToBuy"];

function read(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

/**
 * Per-device ordered list of glance-stat ids shown on the dashboard. `null`
 * before load / when unset means "use DEFAULT_GLANCE".
 */
export function useGlancePrefs() {
  const [order, setOrder] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    setOrder(read());
    const sync = () => setOrder(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = React.useCallback((next: string[]) => {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { order, save };
}
