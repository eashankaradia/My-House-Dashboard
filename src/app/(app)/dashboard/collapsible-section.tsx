"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * A dashboard section card with a title that links to its tab, a badge showing
 * how many things need attention, and a collapse toggle. Open by default.
 */
export function CollapsibleSection({
  title,
  href,
  count,
  children,
}: {
  title: string;
  href: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(true);

  return (
    <Card>
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link href={href} className="truncate text-base font-medium hover:underline">
            {title}
          </Link>
          {count > 0 ? <Badge variant="secondary">{count}</Badge> : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Collapse" : "Expand"}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", !open && "-rotate-90")} />
        </button>
      </div>
      {open ? <div className="space-y-2 px-4 pb-4">{children}</div> : null}
    </Card>
  );
}
