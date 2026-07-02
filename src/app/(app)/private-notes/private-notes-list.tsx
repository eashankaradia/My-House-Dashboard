"use client";

import * as React from "react";
import { SearchInput } from "@/components/shared/search-input";
import { formatDate } from "@/lib/utils";
import type { PrivateNote } from "@/lib/database.types";
import { PrivateNoteForm } from "./private-note-form";

export function PrivateNotesList({ notes }: { notes: PrivateNote[] }) {
  const [search, setSearch] = React.useState("");

  const visible = notes.filter((n) =>
    !search.trim() ? true : (n.title + " " + (n.content ?? "")).toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="space-y-3">
      {notes.length > 5 ? (
        <SearchInput value={search} onChange={setSearch} placeholder="Search private notes…" className="max-w-sm" />
      ) : null}
      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No notes match that search.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((note) => (
            <PrivateNoteForm
              key={note.id}
              note={note}
              trigger={
                <button className="flex h-full w-full flex-col items-start rounded-lg border bg-card p-3 text-left">
                  <p className="font-medium">{note.title}</p>
                  {note.content ? (
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">{note.content}</p>
                  ) : null}
                  <p className="mt-2 text-[11px] text-muted-foreground">{formatDate(note.updated_at)}</p>
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
