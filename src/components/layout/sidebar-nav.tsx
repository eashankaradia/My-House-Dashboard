"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { ALWAYS_VISIBLE, NAV_ITEMS } from "@/lib/constants";
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
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} />
            <span className="truncate">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
