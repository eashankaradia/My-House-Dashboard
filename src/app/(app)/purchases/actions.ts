"use server";

import { revalidatePath } from "next/cache";
import {
  purchaseSchema,
  purchaseOptionSchema,
  type PurchaseInput,
  type PurchaseOptionInput,
} from "@/lib/schemas";
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

// --- Purchase options (competing products to compare) ----------------------

export async function addOption(purchaseId: string, raw: PurchaseOptionInput): Promise<ActionResult> {
  const parsed = purchaseOptionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("purchase_options").insert({
    user_id: user.id,
    purchase_id: purchaseId,
    name: parsed.data.name,
    store: parsed.data.store ?? null,
    url: parsed.data.url ?? null,
    price: parsed.data.price,
    start_price: parsed.data.price,
    image_url: parsed.data.image_url ?? null,
    notes: parsed.data.notes ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/purchases");
  revalidatePath("/dashboard");
  return {};
}

export async function updateOption(id: string, raw: PurchaseOptionInput): Promise<ActionResult> {
  const parsed = purchaseOptionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase } = await getActionContext();
  const { error } = await supabase
    .from("purchase_options")
    .update({
      name: parsed.data.name,
      store: parsed.data.store ?? null,
      url: parsed.data.url ?? null,
      price: parsed.data.price,
      image_url: parsed.data.image_url ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/purchases");
  return {};
}

export async function deleteOption(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("purchase_options").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/purchases");
  revalidatePath("/dashboard");
  return {};
}

/** Move an option up or down the preference ranking and renumber 0..n. */
export async function moveOption(
  purchaseId: string,
  optionId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { data, error: readErr } = await supabase
    .from("purchase_options")
    .select("id, rank, price")
    .eq("purchase_id", purchaseId);
  if (readErr) return { error: readErr.message };

  const ordered = (data ?? [])
    .slice()
    .sort((a, b) => a.rank - b.rank || Number(a.price) - Number(b.price));
  const idx = ordered.findIndex((o) => o.id === optionId);
  if (idx === -1) return { error: "Option not found" };
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= ordered.length) return {};

  [ordered[idx], ordered[swapWith]] = [ordered[swapWith], ordered[idx]];

  // Persist sequential ranks.
  for (let i = 0; i < ordered.length; i++) {
    const { error } = await supabase.from("purchase_options").update({ rank: i }).eq("id", ordered[i].id);
    if (error) return { error: error.message };
  }
  revalidatePath("/purchases");
  return {};
}

/** Mark one option as the chosen one (and clear the others on the same item). */
export async function chooseOption(purchaseId: string, optionId: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const clear = await supabase
    .from("purchase_options")
    .update({ is_chosen: false })
    .eq("purchase_id", purchaseId);
  if (clear.error) return { error: clear.error.message };
  const { error } = await supabase
    .from("purchase_options")
    .update({ is_chosen: true })
    .eq("id", optionId);
  if (error) return { error: error.message };
  revalidatePath("/purchases");
  revalidatePath("/dashboard");
  return {};
}
