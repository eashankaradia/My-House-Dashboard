/** Single cookie holding all per-device UI preferences as a JSON object. */
export const PREFS_COOKIE = "mhd_prefs";

export type PrefsMap = Record<string, unknown>;

/** Safely parse the prefs cookie value (server or client). */
export function parsePrefs(raw: string | undefined): PrefsMap {
  if (!raw) return {};
  try {
    return JSON.parse(decodeURIComponent(raw)) as PrefsMap;
  } catch {
    return {};
  }
}

/** Legacy localStorage keys → prefs keys, for one-time migration in the browser. */
export const LEGACY_LOCALSTORAGE: Record<string, string> = {
  "mhd:hidden-tabs": "hidden-tabs",
  "mhd:dashboard-hidden": "dashboard-hidden",
  "mhd:bottom-tabs": "bottom-tabs",
  "mhd:glance-stats": "glance",
};
