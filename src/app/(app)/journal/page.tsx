import { BookOpen, Plus, PenLine, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { JournalEntry } from "@/lib/database.types";
import { MOOD_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

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
        <Button size="sm" className="gap-1.5">
          <PenLine className="h-4 w-4" />
          {todayEntry ? "Edit today" : "Write today"}
        </Button>
      </PageHeader>

      {/* Today's entry highlight */}
      {!todayEntry && (
        <div className="rounded-xl border border-dashed bg-card/40 p-6 text-center">
          <p className="text-sm font-medium">You haven&apos;t written today yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <Button className="mt-4 gap-1.5">
            <PenLine className="h-4 w-4" />
            Write today&apos;s entry
          </Button>
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No journal entries yet"
          description="Start writing. Capture how you feel, what you're grateful for, and what you want to improve. Even one sentence a day adds up."
        >
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Write your first entry
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Past entries
          </h2>
          <div className="space-y-2">
            {entries.map((entry) => {
              const mood = MOOD_OPTIONS.find((m) => m.value === entry.mood);
              return (
                <button
                  key={entry.id}
                  className="w-full rounded-xl border bg-card px-5 py-4 text-left transition-all hover:shadow-sm active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {new Date(entry.entry_date + "T00:00:00").toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
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
      )}
    </div>
  );
}
