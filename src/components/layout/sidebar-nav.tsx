"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ALWAYS_VISIBLE, NAV_ITEMS } from "@/lib/constants";
import { useHiddenTabs } from "@/hooks/use-hidden-tabs";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { hidden } = useHiddenTabs();
  const items = NAV_ITEMS.filter(
    (i) => ALWAYS_VISIBLE.includes(i.href as (typeof ALWAYS_VISIBLE)[number]) || !hidden.includes(i.href),
  );

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
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
