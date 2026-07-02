"use client";

import * as React from "react";
import { Calendar } from "lucide-react";
import { SearchInput } from "@/components/shared/search-input";
import { cn } from "@/lib/utils";
import type { JournalEntry } from "@/lib/database.types";
import { MOOD_OPTIONS } from "@/lib/constants";

function formatEntryDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function JournalEntriesList({ entries }: { entries: JournalEntry[] }) {
  const [compact, setCompact] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const visible = entries.filter((e) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const hay = [formatEntryDate(e.entry_date), e.content, e.gratitude].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Past entries</h2>
        <div className="flex flex-wrap items-center gap-2">
          {entries.length > 5 ? (
            <SearchInput value={search} onChange={setSearch} placeholder="Search entries…" className="w-full sm:w-48" />
          ) : null}
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
      <div className={compact ? "divide-y rounded-xl border" : "space-y-2"}>
        {visible.length === 0 ? (
          <p className="px-1 py-4 text-center text-sm text-muted-foreground">No entries match that search.</p>
        ) : null}
        {visible.map((entry) => {
          const mood = MOOD_OPTIONS.find((m) => m.value === entry.mood);
          if (compact) {
            return (
              <button
                key={entry.id}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-accent/50"
              >
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate font-medium">{formatEntryDate(entry.entry_date)}</span>
                {mood && (
                  <span className="shrink-0 text-base" title={mood.label}>
                    {mood.emoji}
                  </span>
                )}
              </button>
            );
          }
          return (
            <button
              key={entry.id}
              className="w-full rounded-xl border bg-card px-5 py-4 text-left transition-all hover:shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{formatEntryDate(entry.entry_date)}</p>
                </div>
                {mood && (
                  <span className="text-lg" title={mood.label}>
                    {mood.emoji}
                  </span>
                )}
              </div>
              {entry.content && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{entry.content}</p>
              )}
              {entry.gratitude && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Grateful for:</span> {entry.gratitude}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
