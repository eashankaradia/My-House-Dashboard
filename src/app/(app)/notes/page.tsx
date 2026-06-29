import { ExternalLink, Link2, NotebookPen, Pencil, StickyNote } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Document, UsefulLink } from "@/lib/database.types";
import { NoteForm } from "../documents/note-form";
import { deleteDocument } from "../documents/actions";
import { UsefulLinkForm } from "./useful-link-form";
import { deleteUsefulLink } from "./actions";
import { SectionActivityLog } from "@/components/shared/section-activity-log";

export const metadata = { title: "Notes & links" };

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function NotesPage() {
  const supabase = await createClient();
  const [{ data: noteData }, { data: linkData }] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .eq("category", "Note")
      .order("created_at", { ascending: false }),
    supabase.from("useful_links").select("*").order("created_at", { ascending: false }),
  ]);
  const notes = (noteData ?? []) as Document[];
  const links = (linkData ?? []) as UsefulLink[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes & links"
        description="Quick household notes and the web pages you keep coming back to."
        info="Jot a note with no file needed, or save a useful link (a council page, an insurance portal, a how-to) so everyone in the household can find it."
      >
        <UsefulLinkForm />
        <NoteForm />
      </PageHeader>

      {notes.length === 0 && links.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="Nothing here yet"
          description="Add a quick note for the household, or save a useful link you want to keep handy."
        >
          <NoteForm />
        </EmptyState>
      ) : (
        <>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="h-4 w-4 text-muted-foreground" /> Useful links
                {links.length ? <span className="text-xs font-normal text-muted-foreground">{links.length}</span> : null}
              </CardTitle>
              <UsefulLinkForm
                trigger={
                  <button className="text-sm font-medium text-primary hover:underline">Add link</button>
                }
              />
            </CardHeader>
            <CardContent>
              {links.length === 0 ? (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  No links yet. Save the web pages your household refers to.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {links.map((link) => (
                    <div key={link.id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
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
                        {link.description ? (
                          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{link.description}</p>
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

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <StickyNote className="h-4 w-4 text-muted-foreground" /> Notes
                {notes.length ? <span className="text-xs font-normal text-muted-foreground">{notes.length}</span> : null}
              </CardTitle>
              <NoteForm trigger={<button className="text-sm font-medium text-primary hover:underline">Add note</button>} />
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="py-3 text-center text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {notes.map((note) => (
                    <div key={note.id} className="group relative rounded-lg border bg-amber-50/60 p-3 dark:bg-amber-950/20">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{note.name}</p>
                        <ConfirmDelete itemLabel="note" action={deleteDocument.bind(null, note.id)} />
                      </div>
                      {note.notes ? (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{note.notes}</p>
                      ) : null}
                      <p className="mt-2 text-[11px] text-muted-foreground">{formatDate(note.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
      <SectionActivityLog entityTypes={["documents"]} />
    </div>
  );
}
