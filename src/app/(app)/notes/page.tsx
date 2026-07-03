import { NotebookPen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import type { Document, UsefulLink } from "@/lib/database.types";
import { NoteForm } from "../documents/note-form";
import { UsefulLinkForm } from "./useful-link-form";
import { NotesLinksView } from "./notes-links-view";
import { SectionActivityLog } from "@/components/shared/section-activity-log";

export const metadata = { title: "Notes & links" };

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
        <NotesLinksView notes={notes} links={links} />
      )}
      <SectionActivityLog entityTypes={["documents"]} />
    </div>
  );
}
