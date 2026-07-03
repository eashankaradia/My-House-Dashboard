"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/shared/search-input";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import type { Document } from "@/lib/database.types";
import { DocumentRow } from "./document-row";

export function DocumentsList({ documents }: { documents: Document[] }) {
  const [compact, setCompact] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const visible = documents.filter((d) =>
    !search.trim() ? true : d.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const grouped = DOCUMENT_CATEGORIES.filter((c) => c !== "Note")
    .map((category) => ({
      category,
      docs: visible.filter((d) => d.category === category),
    }))
    .filter((g) => g.docs.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search documents…" className="w-full sm:w-48" />
        <div className="flex items-center rounded-lg border p-0.5 text-xs">
          <button onClick={() => setCompact(false)} className={cn("rounded-md px-2 py-1", !compact && "bg-accent")}>
            Detailed
          </button>
          <button onClick={() => setCompact(true)} className={cn("rounded-md px-2 py-1", compact && "bg-accent")}>
            Compact
          </button>
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No documents match that search.
        </p>
      ) : (
        grouped.map(({ category, docs }) => (
          <section key={category}>
            {/* Sticky section header (pins under the top bar while scrolling). */}
            <div className="sticky top-16 z-10 -mx-1 mb-2 flex items-center gap-2 bg-background/90 px-1 py-1.5 backdrop-blur">
              <h2 className="text-sm font-semibold">{category}</h2>
              <span className="text-xs text-muted-foreground">{docs.length}</span>
            </div>
            <div className={compact ? "space-y-1" : "space-y-2"}>
              {docs.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} compact={compact} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
