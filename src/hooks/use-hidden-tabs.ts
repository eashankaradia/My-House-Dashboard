"use client";

import * as React from "react";

const KEY = "mhd:hidden-tabs";
const EVENT = "mhd:hidden-tabs-changed";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * Per-device preference for which sidebar tabs are hidden. Stored in
 * localStorage and synced across components via a custom event.
 */
export function useHiddenTabs() {
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

  const toggle = React.useCallback((href: string) => {
    const next = read();
    const idx = next.indexOf(href);
    if (idx >= 0) next.splice(idx, 1);
    else next.push(href);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { hidden, toggle };
}
