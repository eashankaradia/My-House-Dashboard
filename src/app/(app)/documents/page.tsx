import { AlertTriangle, FolderArchive, StickyNote, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { daysUntil, formatDate } from "@/lib/utils";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import type { Document } from "@/lib/database.types";
import { DocumentForm } from "./document-form";
import { NoteForm } from "./note-form";
import { DocumentRow } from "./document-row";
import { deleteDocument } from "./actions";
import { SectionActivityLog } from "@/components/shared/section-activity-log";

export const metadata = { title: "Documents & notes" };

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });
  const all = (data ?? []) as Document[];
  const notes = all.filter((d) => d.category === "Note");
  const documents = all.filter((d) => d.category !== "Note");

  const expiringSoon = documents.filter((d) => {
    const days = daysUntil(d.expiry_date);
    return days !== null && days >= 0 && days <= 60;
  });

  const grouped = DOCUMENT_CATEGORIES.filter((c) => c !== "Note")
    .map((category) => ({
      category,
      docs: documents.filter((d) => d.category === category),
    }))
    .filter((g) => g.docs.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Documents & notes" description="Warranties, insurance, manuals, notes and more — all in one place." info="Upload a file (PDF, image or doc up to 10MB) and tag it with a category, or jot a quick note with no file. Add an expiry date to a document to get a renewal reminder. Files are stored privately — use Open to view via a secure, short-lived link.">
        <NoteForm />
        <DocumentForm />
      </PageHeader>

      {all.length === 0 ? (
        <EmptyState
          icon={FolderArchive}
          title="Nothing here yet"
          description="Upload insurance policies, warranties, manuals and certificates, or add a quick note for the household."
        >
          <DocumentForm />
        </EmptyState>
      ) : (
        <>
          {notes.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <StickyNote className="h-4 w-4 text-muted-foreground" /> Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {notes.map((note) => (
                  <div key={note.id} className="group relative rounded-lg border bg-amber-50/60 p-3 dark:bg-amber-950/20">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{note.name}</p>
                      <ConfirmDelete itemLabel="note" action={deleteDocument.bind(null, note.id)} />
                    </div>
                    {note.notes ? <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{note.notes}</p> : null}
                    <p className="mt-2 text-[11px] text-muted-foreground">{formatDate(note.created_at)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {documents.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <StatCard label="Stored documents" value={String(documents.length)} icon={FolderArchive} />
                <StatCard
                  label="Expiring within 60 days"
                  value={String(expiringSoon.length)}
                  icon={AlertTriangle}
                  accent={expiringSoon.length ? "warning" : "muted"}
                />
              </div>

              <div className="space-y-4">
                {grouped.map(({ category, docs }) => (
                  <section key={category}>
                    {/* Sticky section header (pins under the top bar while scrolling). */}
                    <div className="sticky top-16 z-10 -mx-1 mb-2 flex items-center gap-2 bg-background/90 px-1 py-1.5 backdrop-blur">
                      <h2 className="text-sm font-semibold">{category}</h2>
                      <span className="text-xs text-muted-foreground">{docs.length}</span>
                    </div>
                    <div className="space-y-2">
                      {docs.map((doc) => (
                        <DocumentRow key={doc.id} doc={doc} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          ) : null}
        </>
      )}
      <SectionActivityLog entityTypes={["documents"]} />
    </div>
  );
}
