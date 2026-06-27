"use client";

import * as React from "react";
import {
  CalendarClock,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Hammer,
  PiggyBank,
  Plus,
  Receipt,
  ShoppingBag,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/shared/stat-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DEFAULT_GLANCE, useGlancePrefs } from "@/hooks/use-glance-prefs";
import { cn } from "@/lib/utils";

export type GlanceItem = { label: string; sub?: string; href: string };
export type GlanceValue = { value: string; hint?: string; items?: GlanceItem[] };

/** Catalog of stats a user can show. Values are computed on the dashboard. */
export const GLANCE_CATALOG: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "nextBill", label: "Next bill due", icon: CalendarClock },
  { id: "monthlyBills", label: "Monthly bills", icon: Receipt },
  { id: "savingsBalance", label: "Savings balance", icon: PiggyBank },
  { id: "readyToBuy", label: "Ready to buy", icon: ShoppingBag },
  { id: "wishlistItems", label: "Wishlist items", icon: ShoppingBag },
  { id: "openTasks", label: "Open tasks", icon: CheckSquare },
  { id: "activeProjects", label: "Active projects", icon: Hammer },
  { id: "maintenanceDue", label: "Maintenance due (30d)", icon: Wrench },
  { id: "dueThisWeek", label: "Due this week", icon: CalendarClock },
];

const ICONS: Record<string, LucideIcon> = Object.fromEntries(GLANCE_CATALOG.map((c) => [c.id, c.icon]));

/** Renders the user's chosen glance stats, in their chosen order. */
export function GlanceStats({ values }: { values: Record<string, GlanceValue> }) {
  const { order } = useGlancePrefs();
  const ids = (order ?? DEFAULT_GLANCE).filter((id) => values[id]);
  if (ids.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ids.map((id, i) => {
        const v = values[id];
        const meta = GLANCE_CATALOG.find((c) => c.id === id);
        const Icon = ICONS[id];
        const card = (
          <StatCard
            label={meta?.label ?? id}
            value={v.value}
            hint={v.hint}
            icon={Icon}
            accent={i % 2 === 1 ? "muted" : undefined}
          />
        );
        // Stats with a related-items list open a popup when tapped.
        if (v.items) {
          const items = v.items;
          return (
            <Dialog key={id}>
              <DialogTrigger asChild>
                <button type="button" className="rounded-xl text-left transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {card}
                </button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>{meta?.label ?? id}</DialogTitle>
                </DialogHeader>
                {items.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">Nothing here yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {items.map((it, j) => (
                      <Link
                        key={j}
                        href={it.href}
                        className="flex items-center justify-between gap-3 rounded-lg border p-2.5 text-sm transition-colors hover:bg-accent"
                      >
                        <span className="min-w-0 truncate">{it.label}</span>
                        {it.sub ? <span className="shrink-0 text-xs text-muted-foreground">{it.sub}</span> : null}
                      </Link>
                    ))}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          );
        }
        return <div key={id}>{card}</div>;
      })}
    </div>
  );
}

/** Settings UI: choose which glance stats appear, and in what order. */
export function GlanceStatsSettings() {
  const { order, save } = useGlancePrefs();
  const current = order ?? DEFAULT_GLANCE;
  const label = (id: string) => GLANCE_CATALOG.find((c) => c.id === id)?.label ?? id;
  const available = GLANCE_CATALOG.filter((c) => !current.includes(c.id));

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
        {current.map((id, i) => (
          <div key={id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate font-medium">{label(id)}</span>
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label="Move up"
              className={cn("rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground", i === 0 && "opacity-40")}
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === current.length - 1}
              aria-label="Move down"
              className={cn("rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground", i === current.length - 1 && "opacity-40")}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => save(current.filter((x) => x !== id))}
              aria-label="Remove"
              className="rounded p-1 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {current.length === 0 ? (
          <p className="text-sm text-muted-foreground">No glance stats shown. Add some below.</p>
        ) : null}
      </div>

      {available.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {available.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => save([...current, c.id])}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> {c.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
