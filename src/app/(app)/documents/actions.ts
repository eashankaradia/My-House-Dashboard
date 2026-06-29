"use server";

import { revalidatePath } from "next/cache";
import { documentSchema } from "@/lib/schemas";
import { getActionContext, type ActionResult } from "@/lib/action-utils";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

/** Create a document row, uploading an optional file to private storage. */
export async function createDocument(formData: FormData): Promise<ActionResult> {
  const parsed = documentSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    expiry_date: formData.get("expiry_date"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const { supabase, user } = await getActionContext();

  let filePath: string | null = null;
  let fileSize: number | null = null;
  let mimeType: string | null = null;

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) return { error: "File is larger than 10MB" };
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.id}/${Date.now()}-${safeName}`;
    const { error: uploadErr } = await supabase.storage
      .from("documents")
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (uploadErr) return { error: uploadErr.message };
    filePath = path;
    fileSize = file.size;
    mimeType = file.type || null;
  }

  const { error } = await supabase.from("documents").insert({
    user_id: user.id,
    name: parsed.data.name,
    category: parsed.data.category,
    expiry_date: parsed.data.expiry_date ?? null,
    notes: parsed.data.notes ?? null,
    file_path: filePath,
    file_size: fileSize,
    mime_type: mimeType,
  });
  if (error) {
    // Roll back the uploaded file if the row insert failed.
    if (filePath) await supabase.storage.from("documents").remove([filePath]);
    return { error: error.message };
  }

  revalidatePath("/documents");
  revalidatePath("/notes");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { data } = await supabase.from("documents").select("file_path").eq("id", id).single();
  if (data?.file_path) {
    await supabase.storage.from("documents").remove([data.file_path]);
  }
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/documents");
  revalidatePath("/notes");
  revalidatePath("/dashboard");
  return {};
}

/** Create a short-lived signed URL so the owner can download a private file. */
export async function getDocumentUrl(id: string): Promise<{ url?: string; error?: string }> {
  const { supabase } = await getActionContext();
  const { data, error } = await supabase.from("documents").select("file_path").eq("id", id).single();
  if (error || !data?.file_path) return { error: "No file attached" };
  const signed = await supabase.storage.from("documents").createSignedUrl(data.file_path, 60);
  if (signed.error) return { error: signed.error.message };
  return { url: signed.data.signedUrl };
}
