"use server";

import { getActionContext } from "@/lib/action-utils";
import { revalidatePath } from "next/cache";

export async function upsertJournalEntry(input: {
  entry_date: string;
  mood?: string;
  mood_score?: number;
  content?: string;
  gratitude?: string;
  photo_url?: string;
}) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("journal_entries").upsert(
    {
      user_id: user.id,
      entry_date: input.entry_date,
      mood: input.mood ?? null,
      mood_score: input.mood_score ?? null,
      content: input.content ?? null,
      gratitude: input.gratitude ?? null,
      photo_url: input.photo_url ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,entry_date" },
  );
  if (error) return { error: error.message };
  revalidatePath("/journal");
  revalidatePath("/dashboard");
}

export async function deleteJournalEntry(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("journal_entries").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/journal");
}
