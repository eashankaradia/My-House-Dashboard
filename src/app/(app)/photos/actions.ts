"use server";

import { revalidatePath } from "next/cache";
import { getActionContext, type ActionResult } from "@/lib/action-utils";

export async function addQuickPhoto(imageUrl: string, label?: string): Promise<ActionResult> {
  if (!imageUrl) return { error: "No image" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("quick_photos").insert({
    user_id: user.id,
    image_url: imageUrl,
    label: label?.trim() || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/photos");
  return {};
}

export async function updateQuickPhoto(id: string, label: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("quick_photos").update({ label: label.trim() || null }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/photos");
  return {};
}

export async function deleteQuickPhoto(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("quick_photos").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/photos");
  return {};
}
