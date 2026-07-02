import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { JournalEntry } from "@/lib/database.types";
import { JournalForm } from "./journal-form";
import { JournalEntriesList } from "./journal-entries-list";

export const metadata = { title: "Journal" };

export default async function JournalPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .order("entry_date", { ascending: false })
    .limit(30);

  const entries = (data ?? []) as JournalEntry[];

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntry = entries.find((e) => e.entry_date === todayStr);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal"
        description="Reflect on your day, track your mood, and record your thoughts."
        info="Each day has one journal entry. Your entries are private to you."
      >
        <JournalForm entry={todayEntry} />
      </PageHeader>

      {/* Today's entry highlight */}
      {!todayEntry && (
        <div className="rounded-xl border border-dashed bg-card/40 p-6 text-center">
          <p className="text-sm font-medium">You haven&apos;t written today yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <div className="mt-4 flex justify-center">
            <JournalForm />
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No journal entries yet"
          description="Start writing. Capture how you feel, what you're grateful for, and what you want to improve. Even one sentence a day adds up."
        >
          <JournalForm />
        </EmptyState>
      ) : (
        <JournalEntriesList entries={entries} />
      )}
    </div>
  );
}
