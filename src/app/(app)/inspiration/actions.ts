"use server";

import { revalidatePath } from "next/cache";
import { inspirationSchema, collectionSchema, type InspirationInput, type CollectionInput } from "@/lib/schemas";
import { getActionContext, parseTags, type ActionResult } from "@/lib/action-utils";

function toRow(values: InspirationInput) {
  return {
    title: values.title,
    link: values.link ?? null,
    source: values.source,
    category: values.category ?? null,
    room: values.room ?? null,
    tags: parseTags(values.tags),
    notes: values.notes ?? null,
    priority: values.priority,
    status: values.status,
    image_url: values.image_url ?? null,
    collection_id: values.collection_id || null,
  };
}

export async function createInspiration(raw: InspirationInput): Promise<ActionResult> {
  const parsed = inspirationSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("inspiration").insert({ ...toRow(parsed.data), user_id: user.id });
  if (error) return { error: error.message };
  revalidatePath("/inspiration");
  revalidatePath("/dashboard");
  return {};
}

export async function updateInspiration(id: string, raw: InspirationInput): Promise<ActionResult> {
  const parsed = inspirationSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("inspiration").update(toRow(parsed.data)).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/inspiration");
  return {};
}

export async function deleteInspiration(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("inspiration").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/inspiration");
  revalidatePath("/dashboard");
  return {};
}

export async function createCollection(raw: CollectionInput): Promise<ActionResult> {
  const parsed = collectionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase
    .from("collections")
    .insert({ name: parsed.data.name, description: parsed.data.description ?? null, user_id: user.id });
  if (error) return { error: error.message };
  revalidatePath("/inspiration");
  return {};
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/inspiration");
  return {};
}

/**
 * Convert an inspiration into a project or purchase server-side, copying across
 * the relevant fields and marking the inspiration as Planned. Used by the
 * smart-action buttons on each inspiration card.
 */
export async function convertInspiration(
  id: string,
  target: "project" | "purchase",
): Promise<ActionResult> {
  const { supabase, user } = await getActionContext();
  const { data: insp, error: readErr } = await supabase
    .from("inspiration")
    .select("*")
    .eq("id", id)
    .single();
  if (readErr || !insp) return { error: readErr?.message ?? "Inspiration not found" };

  if (target === "project") {
    const { error } = await supabase.from("projects").insert({
      user_id: user.id,
      name: insp.title,
      category: "General",
      description: insp.notes ?? insp.link ?? null,
      priority: insp.priority,
      status: "Idea",
      source_inspiration_id: insp.id,
    });
    if (error) return { error: error.message };
    revalidatePath("/projects");
  } else {
    const { error } = await supabase.from("purchases").insert({
      user_id: user.id,
      name: insp.title,
      url: insp.link ?? null,
      category: "Other",
      room: insp.room ?? null,
      priority: insp.priority,
      status: "Considering",
      notes: insp.notes ?? null,
      source_inspiration_id: insp.id,
    });
    if (error) return { error: error.message };
    revalidatePath("/purchases");
  }

  await supabase.from("inspiration").update({ status: "Planned" }).eq("id", id);
  revalidatePath("/inspiration");
  revalidatePath("/dashboard");
  return {};
}
