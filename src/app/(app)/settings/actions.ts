"use server";

import { revalidatePath } from "next/cache";
import { getActionContext, type ActionResult } from "@/lib/action-utils";

/** Set the current user's household display name (creates the row if needed). */
export async function updateDisplayName(name: string): Promise<ActionResult> {
  const clean = name.trim().slice(0, 60);
  if (!clean) return { error: "Name can't be empty" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase
    .from("household_members")
    .upsert({ user_id: user.id, display_name: clean }, { onConflict: "user_id" });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return {};
}
