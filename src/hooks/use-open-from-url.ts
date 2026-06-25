"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Drives a detail dialog's open state from the URL, so an item can be
 * deep-linked. When the current URL carries `?<param>=<id>`, the matching
 * dialog opens; closing it strips the param so a refresh/back doesn't reopen.
 *
 * Spread the return value onto a controlled <Dialog open onOpenChange>. The
 * DialogTrigger keeps working for normal clicks because Radix routes those
 * through onOpenChange too.
 */
export function useOpenFromUrl(id: string, param = "item") {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const matches = searchParams.get(param) === id;

  const [open, setOpen] = React.useState(matches);

  // Open when the URL starts pointing at this item (covers soft navigations).
  React.useEffect(() => {
    if (matches) setOpen(true);
  }, [matches]);

  const onOpenChange = React.useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next && matches) {
        const sp = new URLSearchParams(Array.from(searchParams.entries()));
        sp.delete(param);
        const qs = sp.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    },
    [matches, param, pathname, router, searchParams],
  );

  return { open, onOpenChange };
}
