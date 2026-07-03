"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { refreshOptionPrices } from "./actions";

/**
 * Fires once per Purchases page visit: re-checks each option's link (the
 * same "Auto-fill" lookup used when adding one) for a current price, so
 * prices stay fresh without anyone having to re-open and re-save each
 * option by hand. Options checked in the last 15 minutes are skipped
 * server-side, so switching tabs back and forth doesn't re-hit every link.
 */
export function PriceRefresh() {
  const router = useRouter();
  const { toast } = useToast();
  const ran = React.useRef(false);

  React.useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      const { updated } = await refreshOptionPrices();
      if (updated > 0) {
        toast({ title: `Updated ${updated} price${updated === 1 ? "" : "s"}` });
        router.refresh();
      }
    })();
  }, [router, toast]);

  return null;
}
