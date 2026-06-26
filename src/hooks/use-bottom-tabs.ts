"use client";

import * as React from "react";

const KEY = "mhd:bottom-tabs";
const EVENT = "mhd:bottom-tabs-changed";

/** Default bottom-bar tabs (hrefs), in order. */
export const DEFAULT_BOTTOM_TABS = ["/dashboard", "/bills", "/projects", "/inspiration"];

function read(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

/** Per-device ordered list of bottom-bar tab hrefs (null = use defaults). */
export function useBottomTabs() {
  const [tabs, setTabs] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    setTabs(read());
    const sync = () => setTabs(read());
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

  return { tabs, save };
}
