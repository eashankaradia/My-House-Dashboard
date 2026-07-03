"use client";

import * as React from "react";
import { ExternalLink, Link2, Pencil, StickyNote } from "lucide-react";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { SearchInput } from "@/components/shared/search-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import type { Document, UsefulLink } from "@/lib/database.types";
import { NoteForm } from "../documents/note-form";
import { deleteDocument } from "../documents/actions";
import { UsefulLinkForm } from "./useful-link-form";
import { deleteUsefulLink } from "./actions";
import { NoteDetailDialog } from "./note-detail-dialog";

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Strip markdown syntax for a plain-text preview snippet. */
function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`{1,3}(.+?)`{1,3}/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^>\s/gm, "")
    .replace(/^[-*\d.]+\s/gm, "")
    .replace(/\n+/g, " ")
    .trim();
}

export function NotesLinksView({ notes, links }: { notes: Document[]; links: UsefulLink[] }) {
  const [compact, setCompact] = React.useState(false);
  const [linkSearch, setLinkSearch] = React.useState("");
  const [noteSearch, setNoteSearch] = React.useState("");

  const visibleLinks = links.filter((l) =>
    !linkSearch.trim()
      ? true
      : (l.title + " " + hostOf(l.url)).toLowerCase().includes(linkSearch.trim().toLowerCase()),
  );
  const visibleNotes = notes.filter((n) =>
    !noteSearch.trim() ? true : n.name.toLowerCase().includes(noteSearch.trim().toLowerCase()),
  );

  return (
    <>
      <div className="flex justify-end">
        <div className="flex items-center rounded-lg border p-0.5 text-xs">
          <button
            onClick={() => setCompact(false)}
            className={cn("rounded-md px-2 py-1", !compact && "bg-accent")}
          >
            Detailed
          </button>
          <button
            onClick={() => setCompact(true)}
            className={cn("rounded-md px-2 py-1", compact && "bg-accent")}
          >
            Compact
          </button>
        </div>
      </div>

      {/* ── Links ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex-col items-stretch gap-2 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4 text-muted-foreground" /> Useful links
            {links.length ? (
              <span className="text-xs font-normal text-muted-foreground">{links.length}</span>
            ) : null}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {links.length > 5 ? (
              <SearchInput
                value={linkSearch}
                onChange={setLinkSearch}
                placeholder="Search links…"
                className="w-full sm:w-48"
              />
            ) : null}
            <UsefulLinkForm
              trigger={
                <button className="text-sm font-medium text-primary hover:underline">
                  Add link
                </button>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              No links yet. Save the web pages your household refers to.
            </p>
          ) : visibleLinks.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              No links match that search.
            </p>
          ) : (
            <div className={cn("grid gap-2", compact ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
              {visibleLinks.map((link) => (
                <div
                  key={link.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border bg-card",
                    compact ? "p-2" : "p-3",
                  )}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Link2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 font-medium hover:underline"
                    >
                      <span className="truncate">{link.title}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </a>
                    <p className="truncate text-xs text-muted-foreground">{hostOf(link.url)}</p>
                    {link.description && !compact ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {link.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center">
                    <UsefulLinkForm
                      link={link}
                      trigger={
                        <button
                          aria-label="Edit link"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-transform hover:bg-accent hover:text-foreground active:scale-90"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      }
                    />
                    <ConfirmDelete itemLabel="link" action={deleteUsefulLink.bind(null, link.id)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Notes ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex-col items-stretch gap-2 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <StickyNote className="h-4 w-4 text-muted-foreground" /> Notes
            {notes.length ? (
              <span className="text-xs font-normal text-muted-foreground">{notes.length}</span>
            ) : null}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {notes.length > 5 ? (
              <SearchInput
                value={noteSearch}
                onChange={setNoteSearch}
                placeholder="Search notes…"
                className="w-full sm:w-48"
              />
            ) : null}
            <NoteForm
              trigger={
                <button className="text-sm font-medium text-primary hover:underline">
                  Add note
                </button>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">No notes yet.</p>
          ) : visibleNotes.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              No notes match that search.
            </p>
          ) : (
            <div className={cn("grid gap-3", compact ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
              {visibleNotes.map((note) => {
                const preview = note.notes ? stripMarkdown(note.notes) : "";
                return (
                  <NoteDetailDialog
                    key={note.id}
                    note={note}
                    trigger={
                      <button
                        className={cn(
                          "group relative w-full rounded-lg border bg-amber-50/60 text-left transition-shadow hover:shadow-sm active:scale-[0.99] dark:bg-amber-950/20",
                          compact ? "p-2" : "p-3",
                        )}
                      >
                        <p className="font-medium leading-snug">{note.name}</p>
                        {preview && !compact ? (
                          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                            {preview}
                          </p>
                        ) : null}
                        {!compact ? (
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            {formatDate(note.updated_at ?? note.created_at)}
                          </p>
                        ) : null}
                        <div
                          role="none"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-1 top-1 flex items-center opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <ConfirmDelete
                            itemLabel="note"
                            action={deleteDocument.bind(null, note.id)}
                          />
                        </div>
                      </button>
                    }
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
