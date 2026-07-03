"use server";

import { revalidatePath } from "next/cache";
import { getActionContext, type ActionResult } from "@/lib/action-utils";

/** Set the current user's household display name (creates the row if needed). */
export async function updateDisplayName(name: string): Promise<ActionResult> {
  const clean = name.trim().slice(0, 60);
  if (!clean) return { error: "Name can't be empty" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase
    .from("household_members")
    .upsert({ user_id: user.id, display_name: clean }, { onConflict: "user_id" });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return {};
}

/** Set the current user's personal colour (their name shows in it everywhere). */
export async function updateMemberColor(color: string): Promise<ActionResult> {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase
    .from("household_members")
    .update({ color: color || null })
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return {};
}

export async function addPurchaseCategory(name: string): Promise<ActionResult> {
  const clean = name.trim().slice(0, 80);
  if (!clean) return { error: "Enter a category name" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase
    .from("purchase_categories")
    .insert({ user_id: user.id, name: clean });
  if (error) {
    if (error.code === "23505") return { error: "That category already exists" };
    return { error: error.message };
  }
  revalidatePath("/settings");
  revalidatePath("/purchases");
  return {};
}

export async function removePurchaseCategory(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("purchase_categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/purchases");
  return {};
}

function randomInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

/** Create an invite code for the caller's household (they must have set a display name first). */
export async function createHouseholdInvite(): Promise<ActionResult & { code?: string }> {
  const { supabase, user } = await getActionContext();
  const { data: me, error: meError } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (meError) return { error: meError.message };
  if (!me) return { error: "Set your display name first (above) so you have a household to invite to." };

  const code = randomInviteCode();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("household_invites").insert({
    household_id: me.household_id,
    code,
    created_by: user.id,
    expires_at: expiresAt,
  });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { code };
}

/** Join another household using an invite code. */
export async function joinHousehold(code: string): Promise<ActionResult> {
  const clean = code.trim().toUpperCase();
  if (!clean) return { error: "Enter an invite code" };
  const { supabase } = await getActionContext();
  const { data, error } = await supabase.rpc("redeem_household_invite", { p_code: clean });
  if (error) return { error: error.message };
  if (!data) return { error: "That code is invalid or expired. Make sure your display name is set first." };
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return {};
}
