"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { ALWAYS_VISIBLE, NAV_GROUPS, NAV_ITEMS, type NavItem } from "@/lib/constants";
import { useHiddenTabs } from "@/hooks/use-hidden-tabs";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { hidden } = useHiddenTabs();
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const items = NAV_ITEMS.filter(
    (i) => ALWAYS_VISIBLE.includes(i.href as (typeof ALWAYS_VISIBLE)[number]) || !hidden.includes(i.href),
  ).filter((i) => (q ? i.title.toLowerCase().includes(q) : true));

  function renderLink(item: NavItem) {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} />
        <span className="truncate">{item.title}</span>
      </Link>
    );
  }

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
      <div className="relative mb-1 px-0.5">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tabs…"
          className="h-9 w-full rounded-lg border bg-background pl-8 pr-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {q ? (
        // While searching, show a flat list of matches (no group headings).
        items.map(renderLink)
      ) : (
        NAV_GROUPS.map((group) => {
          const groupItems = items.filter((i) => i.group === group);
          if (groupItems.length === 0) return null;
          return (
            <div key={group} className="mt-2 first:mt-0">
              {group !== "Overview" ? (
                <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  {group}
                </p>
              ) : null}
              {groupItems.map(renderLink)}
            </div>
          );
        })
      )}
    </nav>
  );
}
