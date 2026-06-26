"use server";

import { revalidatePath } from "next/cache";
import { getActionContext, type ActionResult } from "@/lib/action-utils";

export async function addShoppingItem(raw: {
  name: string;
  quantity?: string;
  category?: string;
}): Promise<ActionResult> {
  const name = raw.name?.trim();
  if (!name) return { error: "Enter an item" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("shopping_items").insert({
    user_id: user.id,
    name: name.slice(0, 160),
    quantity: raw.quantity?.trim() || null,
    category: raw.category?.trim() || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/shopping");
  return {};
}

/** Tick an item off (got it) or back on, recording when it was got. */
export async function setShoppingItemGot(id: string, got: boolean): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase
    .from("shopping_items")
    .update({ is_got: got, got_at: got ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/shopping");
  return {};
}

export async function deleteShoppingItem(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("shopping_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/shopping");
  return {};
}

/** Clear every item that's already been got. */
export async function clearGotItems(): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("shopping_items").delete().eq("is_got", true);
  if (error) return { error: error.message };
  revalidatePath("/shopping");
  return {};
}
