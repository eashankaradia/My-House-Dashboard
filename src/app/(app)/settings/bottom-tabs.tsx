"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { DEFAULT_BOTTOM_TABS, useBottomTabs } from "@/hooks/use-bottom-tabs";
import { cn } from "@/lib/utils";

const MAX = 4;
const title = (href: string) => NAV_ITEMS.find((n) => n.href === href)?.title ?? href;

/** Settings UI: choose which tabs appear in the mobile bottom bar, and order. */
export function BottomTabsSettings() {
  const { tabs, save } = useBottomTabs();
  const current = (tabs ?? DEFAULT_BOTTOM_TABS).slice(0, MAX);
  const available = NAV_ITEMS.filter((n) => !current.includes(n.href));

  function move(i: number, dir: -1 | 1) {
    const next = [...current];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    save(next);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {current.map((href, i) => (
          <div key={href} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate font-medium">{title(href)}</span>
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"
              className={cn("rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground", i === 0 && "opacity-40")}>
              <ChevronUp className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === current.length - 1} aria-label="Move down"
              className={cn("rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground", i === current.length - 1 && "opacity-40")}>
              <ChevronDown className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => save(current.filter((x) => x !== href))} aria-label="Remove"
              className="rounded p-1 text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {current.length < MAX && available.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {available.map((n) => (
            <button key={n.href} type="button" onClick={() => save([...current, n.href])}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
              <Plus className="h-3.5 w-3.5" /> {n.title}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Up to {MAX} tabs. Remove one to add another.</p>
      )}
    </div>
  );
}
