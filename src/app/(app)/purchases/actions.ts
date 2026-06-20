"use server";

import { revalidatePath } from "next/cache";
import { purchaseSchema, type PurchaseInput } from "@/lib/schemas";
import { PURCHASE_STATUSES } from "@/lib/constants";
import { getActionContext, type ActionResult } from "@/lib/action-utils";

function toRow(values: PurchaseInput) {
  return {
    name: values.name,
    url: values.url ?? null,
    store: values.store ?? null,
    price: values.price,
    category: values.category,
    sub_category: values.sub_category ?? null,
    room: values.room ?? null,
    priority: values.priority,
    status: values.status,
    notes: values.notes ?? null,
    purchased_at: values.status === "Purchased" ? new Date().toISOString().slice(0, 10) : null,
  };
}

export async function createPurchase(raw: PurchaseInput): Promise<ActionResult> {
  const parsed = purchaseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("purchases").insert({ ...toRow(parsed.data), user_id: user.id });
  if (error) return { error: error.message };
  revalidatePath("/purchases");
  revalidatePath("/dashboard");
  return {};
}

export async function updatePurchase(id: string, raw: PurchaseInput): Promise<ActionResult> {
  const parsed = purchaseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("purchases").update(toRow(parsed.data)).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/purchases");
  revalidatePath("/dashboard");
  return {};
}

export async function updatePurchaseStatus(id: string, status: string): Promise<ActionResult> {
  if (!PURCHASE_STATUSES.includes(status as (typeof PURCHASE_STATUSES)[number])) {
    return { error: "Invalid status" };
  }
  const { supabase } = await getActionContext();
  const { error } = await supabase
    .from("purchases")
    .update({
      status: status as (typeof PURCHASE_STATUSES)[number],
      purchased_at: status === "Purchased" ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/purchases");
  revalidatePath("/dashboard");
  return {};
}

export async function deletePurchase(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("purchases").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/purchases");
  revalidatePath("/dashboard");
  return {};
}
