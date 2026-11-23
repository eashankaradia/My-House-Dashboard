"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/shared/search-input";
import type { Essential } from "@/lib/database.types";
import { EssentialForm } from "./essential-form";

const RAG_DOT: Record<string, string> = {
  red: "bg-rose-500",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
};

const RAG_LABEL: Record<"red" | "amber" | "green", string> = {
  red: "Still need",
  amber: "So-so",
  green: "Have",
};

export function EssentialsView({ items }: { items: Essential[] }) {
  const [compact, setCompact] = React.useState(true);
  const [ragFilter, setRagFilter] = React.useState<"red" | "amber" | "green" | null>(null);
  const [search, setSearch] = React.useState("");
  const categories = Array.from(new Set(items.map((i) => i.category)));

  const counts = items.reduce(
    (acc, i) => {
      acc[i.rag as "red" | "amber" | "green"] = (acc[i.rag as "red" | "amber" | "green"] ?? 0) + 1;
      return acc;
    },
    { red: 0, amber: 0, green: 0 } as Record<"red" | "amber" | "green", number>,
  );
  const visibleItems = items
    .filter((i) => (ragFilter ? i.rag === ragFilter : true))
    .filter((i) => (!search.trim() ? true : i.name.toLowerCase().includes(search.trim().toLowerCase())));

  // With ~100 items across 8 categories, a filter or search is the point of
  // the page — so matching sections open themselves rather than making you
  // expand each one.
  const narrowing = Boolean(ragFilter) || Boolean(search.trim());

  const groups = categories
    .map((category) => ({
      category,
      items: visibleItems.filter((i) => i.category === category),
      needed: items.filter((i) => i.category === category && i.rag === "red").length,
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <button
            type="button"
            onClick={() => setRagFilter(null)}
            aria-pressed={ragFilter === null}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-colors",
              ragFilter === null ? "border-border bg-accent font-medium" : "border-transparent text-muted-foreground",
            )}
          >
            All {items.length}
          </button>
          {(["red", "amber", "green"] as const).map((rag) =>
            counts[rag] === 0 ? null : (
              <button
                key={rag}
                type="button"
                onClick={() => setRagFilter((cur) => (cur === rag ? null : rag))}
                aria-pressed={ragFilter === rag}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  ragFilter === rag ? "border-border bg-accent font-medium" : "border-transparent text-muted-foreground",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", RAG_DOT[rag])} />
                {RAG_LABEL[rag]} {counts[rag]}
              </button>
            ),
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search essentials…" className="w-full sm:w-48" />
          <div className="flex items-center rounded-lg border p-0.5 text-xs">
            <button onClick={() => setCompact(false)} className={cn("rounded-md px-2 py-1", !compact && "bg-accent")}>
              Detailed
            </button>
            <button onClick={() => setCompact(true)} className={cn("rounded-md px-2 py-1", compact && "bg-accent")}>
              Compact
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {groups.map((group, i) => (
          <CategorySection
            // Remounting when narrowing starts/stops re-derives the open
            // state, so filtering reveals matches without extra taps.
            key={`${group.category}|${narrowing}`}
            category={group.category}
            items={group.items}
            needed={group.needed}
            categories={categories}
            compact={compact}
            defaultOpen={narrowing || i === 0}
          />
        ))}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Add the things you need, grouped by category, and mark what you have.
        </p>
      ) : visibleItems.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nothing matches.
        </p>
      ) : null}
    </div>
  );
}

function CategorySection({
  category,
  items,
  needed,
  categories,
  compact,
  defaultOpen,
}: {
  category: string;
  items: Essential[];
  needed: number;
  categories: string[];
  compact: boolean;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{category}</span>
          {needed > 0 ? (
            <span className="shrink-0 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
              {needed} needed
            </span>
          ) : null}
          <span className="shrink-0 text-xs text-muted-foreground">{items.length}</span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </button>
        <EssentialForm
          categories={categories}
          defaultCategory={category}
          trigger={<button className="shrink-0 text-xs font-medium text-primary hover:underline">Add</button>}
        />
      </div>

      {open ? (
        <div className={cn("border-t p-3", compact ? "grid grid-cols-2 gap-1.5 sm:grid-cols-3" : "space-y-1.5")}>
          {items.map((item) => (
            <EssentialForm
              key={item.id}
              categories={categories}
              essential={item}
              trigger={
                compact ? (
                  <button className="flex w-full items-center gap-2 rounded-lg border bg-background px-3 py-2 text-left text-sm">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", RAG_DOT[item.rag] ?? RAG_DOT.red)} />
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  </button>
                ) : (
                  <button className="flex w-full items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-left text-sm">
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", RAG_DOT[item.rag] ?? RAG_DOT.red)} />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{item.name}</span>
                      {item.have_notes && <span className="text-muted-foreground"> — {item.have_notes}</span>}
                    </span>
                  </button>
                )
              }
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
