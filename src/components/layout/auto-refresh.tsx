"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/**
 * Lightweight "near-live" sync for a shared household: re-fetches server data
 * when the tab regains focus and every 45s while visible. So when Neelam adds
 * something, Eashan's screen catches up without a manual refresh — no extra
 * infrastructure required.
 */
export function AutoRefresh() {
  const router = useRouter();

  React.useEffect(() => {
    let last = Date.now();

    const refresh = () => {
      last = Date.now();
      router.refresh();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - last > 5000) refresh();
    };

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 45_000);

    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
