"use server";

import { revalidatePath } from "next/cache";
import { getActionContext, type ActionResult } from "@/lib/action-utils";
import type { Draft } from "@/lib/database.types";

export async function addDraft(data: {
  kind: string;
  title: string;
  notes?: string;
  image_url?: string | null;
}): Promise<ActionResult> {
  const title = data.title?.trim();
  if (!title) return { error: "Give the draft a title" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("drafts").insert({
    user_id: user.id,
    kind: data.kind || "note",
    title: title.slice(0, 160),
    notes: data.notes?.trim() || null,
    image_url: data.image_url || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/drafts");
  return {};
}

export async function updateDraft(id: string, patch: { title?: string; notes?: string }): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const clean: Partial<Draft> = {};
  if (patch.title !== undefined) clean.title = patch.title.trim() || "Untitled";
  if (patch.notes !== undefined) clean.notes = patch.notes.trim() || null;
  const { error } = await supabase.from("drafts").update(clean).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/drafts");
  return {};
}

export async function deleteDraft(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("drafts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/drafts");
  return {};
}
