"use server";

import { revalidatePath } from "next/cache";
import { savingsPotSchema, type SavingsPotInput } from "@/lib/schemas";
import { getActionContext, type ActionResult } from "@/lib/action-utils";

function toRow(values: SavingsPotInput) {
  return {
    name: values.name,
    target_amount: values.target_amount,
    current_amount: values.current_amount,
    monthly_contribution: values.monthly_contribution,
    target_date: values.target_date ?? null,
    color: values.color,
    notes: values.notes ?? null,
  };
}

export async function createPot(raw: SavingsPotInput): Promise<ActionResult> {
  const parsed = savingsPotSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("savings_pots").insert({ ...toRow(parsed.data), user_id: user.id });
  if (error) return { error: error.message };
  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return {};
}

export async function updatePot(id: string, raw: SavingsPotInput): Promise<ActionResult> {
  const parsed = savingsPotSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("savings_pots").update(toRow(parsed.data)).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return {};
}

export async function deletePot(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("savings_pots").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return {};
}

/** Quick adjust a pot balance (the + / − buttons on a pot card). */
export async function adjustPot(id: string, delta: number): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { data, error: readErr } = await supabase
    .from("savings_pots")
    .select("current_amount")
    .eq("id", id)
    .single();
  if (readErr) return { error: readErr.message };
  const next = Math.max(0, Number(data.current_amount) + delta);
  const { error } = await supabase.from("savings_pots").update({ current_amount: next }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return {};
}
