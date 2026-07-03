"use server";

import { revalidatePath } from "next/cache";
import { contactSchema } from "@/lib/schemas";
import { getActionContext, type ActionResult } from "@/lib/action-utils";
import type { Contact } from "@/lib/database.types";

export async function createContact(formData: FormData): Promise<ActionResult> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    url: formData.get("url"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("contacts").insert({
    user_id: user.id,
    name: parsed.data.name,
    role: parsed.data.role ?? null,
    phone: parsed.data.phone ?? null,
    email: parsed.data.email ?? null,
    address: parsed.data.address ?? null,
    url: parsed.data.url ?? null,
    notes: parsed.data.notes ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/contacts");
  return {};
}

export async function updateContact(id: string, formData: FormData): Promise<ActionResult> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    url: formData.get("url"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const { supabase } = await getActionContext();
  const { error } = await supabase
    .from("contacts")
    .update({
      name: parsed.data.name,
      role: parsed.data.role ?? null,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email ?? null,
      address: parsed.data.address ?? null,
      url: parsed.data.url ?? null,
      notes: parsed.data.notes ?? null,
    } as Partial<Contact>)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/contacts");
  return {};
}

export async function deleteContact(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/contacts");
  return {};
}
