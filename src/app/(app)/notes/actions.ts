"use server";

import { revalidatePath } from "next/cache";
import { usefulLinkSchema, type UsefulLinkInput } from "@/lib/schemas";
import { getActionContext, type ActionResult } from "@/lib/action-utils";
import type { UsefulLink } from "@/lib/database.types";

export async function createUsefulLink(raw: UsefulLinkInput): Promise<ActionResult> {
  const parsed = usefulLinkSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("useful_links").insert({
    user_id: user.id,
    title: parsed.data.title,
    url: parsed.data.url,
    description: parsed.data.description ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/notes");
  return {};
}

export async function updateUsefulLink(id: string, raw: UsefulLinkInput): Promise<ActionResult> {
  const parsed = usefulLinkSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase } = await getActionContext();
  const clean = {
    title: parsed.data.title,
    url: parsed.data.url,
    description: parsed.data.description ?? null,
  };
  const { error } = await supabase
    .from("useful_links")
    .update(clean as Partial<UsefulLink>)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/notes");
  return {};
}

export async function deleteUsefulLink(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("useful_links").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/notes");
  return {};
}
