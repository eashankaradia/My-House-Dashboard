"use server";

import { revalidatePath } from "next/cache";
import { getActionContext, type ActionResult } from "@/lib/action-utils";

export async function createPrivateNote(input: { title: string; content?: string }): Promise<ActionResult> {
  if (!input.title.trim()) return { error: "Title is required" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("private_notes").insert({
    user_id: user.id,
    title: input.title.trim(),
    content: input.content?.trim() || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/private-notes");
  return {};
}

export async function updatePrivateNote(id: string, input: { title: string; content?: string }): Promise<ActionResult> {
  if (!input.title.trim()) return { error: "Title is required" };
  const { supabase } = await getActionContext();
  const { error } = await supabase
    .from("private_notes")
    .update({ title: input.title.trim(), content: input.content?.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/private-notes");
  return {};
}

export async function deletePrivateNote(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("private_notes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/private-notes");
  return {};
}
