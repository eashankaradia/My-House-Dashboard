"use server";

import { revalidatePath } from "next/cache";
import { getActionContext, type ActionResult } from "@/lib/action-utils";

/** Permanently delete one or more change-log entries from the database. */
export async function deleteActivities(ids: number[]): Promise<ActionResult> {
  const clean = ids.filter((n) => Number.isFinite(n));
  if (!clean.length) return {};
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("activity_log").delete().in("id", clean);
  if (error) return { error: error.message };
  revalidatePath("/activity");
  return {};
}
