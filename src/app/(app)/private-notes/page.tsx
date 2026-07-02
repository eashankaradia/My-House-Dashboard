import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import type { PrivateNote } from "@/lib/database.types";
import { PrivateNoteForm } from "./private-note-form";
import { PrivateNotesList } from "./private-notes-list";

export const metadata = { title: "Private notes" };

export default async function PrivateNotesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("private_notes").select("*").order("updated_at", { ascending: false });
  const notes = (data ?? []) as PrivateNote[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Private notes"
        description="Freeform notes only you can see — never shared with the household."
        info="Unlike Notes & Links, nothing here is visible to other household members. Good for anything you'd rather keep to yourself."
      >
        <PrivateNoteForm />
      </PageHeader>

      {notes.length === 0 ? (
        <EmptyState icon={Lock} title="Nothing here yet" description="Jot down anything you want to keep private — it stays visible to only you.">
          <PrivateNoteForm />
        </EmptyState>
      ) : (
        <PrivateNotesList notes={notes} />
      )}
    </div>
  );
}
