"use server";

import { revalidatePath } from "next/cache";
import { billSchema, type BillInput } from "@/lib/schemas";
import { getActionContext, type ActionResult } from "@/lib/action-utils";

function toRow(values: BillInput) {
  return {
    name: values.name,
    category: values.category,
    amount: values.amount,
    frequency: values.frequency,
    due_date: values.due_date ?? null,
    payment_account: values.payment_account ?? null,
    is_fixed: values.is_fixed,
    notes: values.notes ?? null,
  };
}

export async function createBill(raw: BillInput): Promise<ActionResult> {
  const parsed = billSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("bills").insert({ ...toRow(parsed.data), user_id: user.id });
  if (error) return { error: error.message };

  revalidatePath("/bills");
  revalidatePath("/dashboard");
  return {};
}

export async function updateBill(id: string, raw: BillInput): Promise<ActionResult> {
  const parsed = billSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const { supabase } = await getActionContext();
  const { error } = await supabase.from("bills").update(toRow(parsed.data)).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/bills");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteBill(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("bills").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/bills");
  revalidatePath("/dashboard");
  return {};
}
