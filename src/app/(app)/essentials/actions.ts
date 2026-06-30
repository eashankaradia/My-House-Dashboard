"use server";

import { getActionContext } from "@/lib/action-utils";
import { revalidatePath } from "next/cache";

export async function createEssential(input: { category: string; name: string; rag?: string; have_notes?: string; order_index?: number }) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("essentials").insert({
    user_id: user.id,
    category: input.category,
    name: input.name,
    rag: input.rag ?? "red",
    have_notes: input.have_notes ?? null,
    order_index: input.order_index ?? 0,
  });
  if (error) return { error: error.message };
  revalidatePath("/essentials");
}

export async function updateEssential(
  id: string,
  input: Partial<{ category: string; name: string; rag: string; have_notes: string | null; order_index: number }>,
) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("essentials").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/essentials");
}

export async function deleteEssential(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("essentials").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/essentials");
}
