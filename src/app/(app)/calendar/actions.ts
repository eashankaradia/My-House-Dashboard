"use server";

import { revalidatePath } from "next/cache";
import { getActionContext, type ActionResult } from "@/lib/action-utils";

const RECURRENCES = ["none", "weekly", "monthly", "yearly"] as const;
type Recurrence = (typeof RECURRENCES)[number];

/** Add a user event to a date, optionally recurring. */
export async function createCalendarEvent(input: {
  title: string;
  event_date: string;
  recurrence?: string;
  notes?: string | null;
}): Promise<ActionResult> {
  const title = input.title.trim();
  if (!title) return { error: "Give the event a title" };
  if (!input.event_date) return { error: "Pick a date" };
  const recurrence = (RECURRENCES.includes(input.recurrence as Recurrence) ? input.recurrence : "none") as Recurrence;

  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("calendar_events").insert({
    user_id: user.id,
    title,
    event_date: input.event_date,
    recurrence,
    notes: input.notes || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/calendar");
  return {};
}

export async function deleteCalendarEvent(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/calendar");
  return {};
}
