"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Essential } from "@/lib/database.types";
import { EssentialForm } from "./essential-form";

const RAG_DOT: Record<string, string> = {
  red: "bg-rose-500",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
};

export function EssentialsView({ items }: { items: Essential[] }) {
  const [compact, setCompact] = React.useState(true);
  const [ragFilter, setRagFilter] = React.useState<"red" | "amber" | "green" | null>(null);
  const categories = Array.from(new Set(items.map((i) => i.category)));

  const counts = items.reduce(
    (acc, i) => {
      acc[i.rag as "red" | "amber" | "green"] = (acc[i.rag as "red" | "amber" | "green"] ?? 0) + 1;
      return acc;
    },
    { red: 0, amber: 0, green: 0 } as Record<"red" | "amber" | "green", number>,
  );
  const visibleItems = ragFilter ? items.filter((i) => i.rag === ragFilter) : items;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          {(["green", "amber", "red"] as const).map((rag) => (
            <button
              key={rag}
              type="button"
              onClick={() => setRagFilter((cur) => (cur === rag ? null : rag))}
              aria-pressed={ragFilter === rag}
              className={cn(
                "flex items-center gap-1.5 rounded-full border border-transparent px-1.5 py-0.5",
                ragFilter === rag && "border-border bg-accent",
                ragFilter && ragFilter !== rag && "opacity-40",
              )}
            >
              <span className={cn("h-2.5 w-2.5 rounded-full", RAG_DOT[rag])} /> {counts[rag]}
            </button>
          ))}
        </div>
        <div className="flex items-center rounded-lg border p-0.5 text-xs">
          <button onClick={() => setCompact(false)} className={cn("rounded-md px-2 py-1", !compact && "bg-accent")}>
            Detailed
          </button>
          <button onClick={() => setCompact(true)} className={cn("rounded-md px-2 py-1", compact && "bg-accent")}>
            Compact
          </button>
        </div>
      </div>

      {categories.map((category) => {
        const categoryItems = visibleItems.filter((i) => i.category === category);
        if (categoryItems.length === 0) return null;
        return (
          <section key={category} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{category}</h2>
              <EssentialForm
                categories={categories}
                defaultCategory={category}
                trigger={<button className="text-xs font-medium text-primary hover:underline">Add</button>}
              />
            </div>
            <div className={cn(compact ? "grid grid-cols-2 gap-1.5 sm:grid-cols-3" : "space-y-1.5")}>
              {categoryItems.map((item) =>
                compact ? (
                  <EssentialForm
                    key={item.id}
                    categories={categories}
                    essential={item}
                    trigger={
                      <button className="flex w-full items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm">
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", RAG_DOT[item.rag] ?? RAG_DOT.red)} />
                        <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      </button>
                    }
                  />
                ) : (
                  <EssentialForm
                    key={item.id}
                    categories={categories}
                    essential={item}
                    trigger={
                      <button className="flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left text-sm">
                        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", RAG_DOT[item.rag] ?? RAG_DOT.red)} />
                        <span className="min-w-0 flex-1">
                          <span className="font-medium">{item.name}</span>
                          {item.have_notes && <span className="text-muted-foreground"> — {item.have_notes}</span>}
                        </span>
                      </button>
                    }
                  />
                ),
              )}
            </div>
          </section>
        );
      })}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Add the things you need, grouped by category, and mark what you have.
        </p>
      ) : visibleItems.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nothing at that status.
        </p>
      ) : null}
    </div>
  );
}
