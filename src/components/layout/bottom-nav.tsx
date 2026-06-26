"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { DEFAULT_BOTTOM_TABS, useBottomTabs } from "@/hooks/use-bottom-tabs";
import { cn } from "@/lib/utils";
import { AddPills } from "./add-menu";

type NavItem = (typeof NAV_ITEMS)[number];

/** Fixed bottom navigation for phones (hidden on lg+), with a centred + button. */
export function BottomNav() {
  const pathname = usePathname();
  const { tabs } = useBottomTabs();
  const [addOpen, setAddOpen] = React.useState(false);

  const hrefs = tabs ?? DEFAULT_BOTTOM_TABS;
  const items = hrefs
    .map((href) => NAV_ITEMS.find((n) => n.href === href))
    .filter((n): n is NavItem => Boolean(n))
    .slice(0, 4);

  // Split the tabs around the central + button.
  const mid = Math.ceil(items.length / 2);
  const left = items.slice(0, mid);
  const right = items.slice(mid);

  function renderTab(item: NavItem) {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
        <span className="max-w-full truncate">{item.title}</span>
      </Link>
    );
  }

  return (
    <>
      {addOpen ? (
        <>
          <button
            type="button"
            aria-label="Close add menu"
            onClick={() => setAddOpen(false)}
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          />
          <div className="fixed inset-x-0 bottom-16 z-50 flex justify-center lg:hidden">
            <AddPills className="flex max-w-[92vw] flex-wrap items-center justify-center gap-2 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur" />
          </div>
        </>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {left.map(renderTab)}
          <button
            type="button"
            onClick={() => setAddOpen((v) => !v)}
            aria-label={addOpen ? "Close add menu" : "Add new"}
            className="flex flex-col items-center justify-center px-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              {addOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </span>
          </button>
          {right.map(renderTab)}
        </div>
      </nav>
    </>
  );
}
