"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, FolderArchive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import type { Collection } from "@/lib/database.types";
import { deleteCollection } from "./actions";

export function CollectionsStrip({
  collections,
  counts,
}: {
  collections: Collection[];
  counts: Record<string, number>;
}) {
  const [open, setOpen] = React.useState(false);
  const totalIdeas = Object.values(counts).reduce((sum, count) => sum + count, 0);

  if (collections.length === 0) return null;

  return (
    <section className="rounded-2xl border bg-card/70">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          <FolderArchive className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="font-medium">Collections</span>
          <Badge variant="secondary">{collections.length}</Badge>
          <span className="truncate text-xs text-muted-foreground">{totalIdeas} saved ideas</span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open ? (
        <div className="flex flex-wrap gap-2 border-t px-3 py-3">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="group flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm"
            >
              <span className="max-w-40 truncate font-medium">{collection.name}</span>
              <Badge variant="secondary">{counts[collection.id] ?? 0}</Badge>
              <ConfirmDelete
                itemLabel="collection"
                action={deleteCollection.bind(null, collection.id)}
                trigger={
                  <button className="text-muted-foreground opacity-60 transition-opacity hover:text-destructive group-hover:opacity-100">
                    ×
                  </button>
                }
              />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
