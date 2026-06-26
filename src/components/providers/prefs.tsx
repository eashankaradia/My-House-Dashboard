"use client";

import * as React from "react";
import { LEGACY_LOCALSTORAGE, PREFS_COOKIE, type PrefsMap } from "@/lib/prefs";

type Ctx = { prefs: PrefsMap; setPref: (key: string, value: unknown) => void };
const PrefsContext = React.createContext<Ctx>({ prefs: {}, setPref: () => {} });

function writeCookie(map: PrefsMap) {
  try {
    document.cookie = `${PREFS_COOKIE}=${encodeURIComponent(JSON.stringify(map))}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    /* ignore */
  }
}

/**
 * Holds all per-device UI prefs. Seeded from the cookie on the server so the
 * first render is already correct (no flash), then updated in-place — context
 * keeps every consumer (nav, dashboard, settings) in sync without custom events.
 */
export function PrefsProvider({ initial, children }: { initial: PrefsMap; children: React.ReactNode }) {
  const [prefs, setPrefs] = React.useState<PrefsMap>(initial);

  // One-time migration of old localStorage prefs into the cookie.
  React.useEffect(() => {
    if (Object.keys(initial).length > 0) return;
    try {
      const migrated: PrefsMap = {};
      for (const [lsKey, prefKey] of Object.entries(LEGACY_LOCALSTORAGE)) {
        const raw = window.localStorage.getItem(lsKey);
        if (raw) {
          try {
            migrated[prefKey] = JSON.parse(raw);
          } catch {
            /* ignore */
          }
        }
      }
      for (const section of ["purchases", "tasks"]) {
        const v = window.localStorage.getItem(`mhd:view:${section}`);
        if (v) migrated[`view:${section}`] = v;
      }
      if (Object.keys(migrated).length) {
        writeCookie(migrated);
        setPrefs(migrated);
      }
    } catch {
      /* ignore */
    }
  }, [initial]);

  const setPref = React.useCallback((key: string, value: unknown) => {
    setPrefs((prev) => {
      const next = { ...prev };
      if (value === undefined || value === null) delete next[key];
      else next[key] = value;
      writeCookie(next);
      return next;
    });
  }, []);

  return <PrefsContext.Provider value={{ prefs, setPref }}>{children}</PrefsContext.Provider>;
}

/** Read/write a single typed preference. */
export function usePref<T>(key: string, fallback: T): [T, (value: T | null) => void] {
  const { prefs, setPref } = React.useContext(PrefsContext);
  const value = (prefs[key] as T | undefined) ?? fallback;
  const set = React.useCallback((v: T | null) => setPref(key, v), [key, setPref]);
  return [value, set];
}
