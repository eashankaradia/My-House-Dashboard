"use client";

import * as React from "react";
import { ChevronDown, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A low-key, collapsed-by-default disclosure for administrative actions
 * (e.g. managing payment accounts) — a small button at the bottom of a page
 * that expands to reveal the management UI.
 */
export function BottomAdmin({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <Settings2 className="h-3.5 w-3.5" />
        {label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !open && "-rotate-90")} />
      </button>
      {open ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}
