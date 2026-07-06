"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A collapsed-by-default "<Title> (N)" panel for items that don't need to
 * clutter the main list (e.g. purchased items, completed projects) but
 * should still be fully browsable, not just named in a restore/delete row —
 * pass the same card/row rendering used for the main list as children.
 */
export function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  if (count === 0) return null;

  return (
    <Card>
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {title} ({count})
          <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
        {open ? <div className="border-t p-4">{children}</div> : null}
      </CardContent>
    </Card>
  );
}
