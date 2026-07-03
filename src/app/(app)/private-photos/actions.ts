"use server";

import { revalidatePath } from "next/cache";
import { getActionContext, type ActionResult } from "@/lib/action-utils";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

/** Upload a photo to the private `documents` bucket (owner-only folder) and save a row for it. */
export async function addPrivatePhoto(formData: FormData): Promise<ActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No photo selected" };
  if (file.size > MAX_BYTES) return { error: "Photo is larger than 10MB" };

  const { supabase, user } = await getActionContext();
  const caption = String(formData.get("caption") ?? "").trim() || null;

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/private-photos/${Date.now()}.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (uploadErr) return { error: uploadErr.message };

  const { error } = await supabase.from("private_photos").insert({ user_id: user.id, file_path: path, caption });
  if (error) {
    await supabase.storage.from("documents").remove([path]);
    return { error: error.message };
  }

  revalidatePath("/private-photos");
  return {};
}

export async function updatePrivatePhotoCaption(id: string, caption: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase
    .from("private_photos")
    .update({ caption: caption.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/private-photos");
  return {};
}

export async function deletePrivatePhoto(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { data } = await supabase.from("private_photos").select("file_path").eq("id", id).single();
  if (data?.file_path) {
    await supabase.storage.from("documents").remove([data.file_path]);
  }
  const { error } = await supabase.from("private_photos").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/private-photos");
  return {};
}
