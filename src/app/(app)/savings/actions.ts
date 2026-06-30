"use server";

import { revalidatePath } from "next/cache";
import {
  savingsAccountSchema,
  savingsContributionSchema,
  savingsPotSchema,
  type SavingsAccountInput,
  type SavingsContributionInput,
  type SavingsPotInput,
} from "@/lib/schemas";
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
    pot_type: values.pot_type,
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

/**
 * Record a signed amount against a pot: inserts a contribution row (the ledger
 * that powers the over-time chart and per-account balances) and moves the pot's
 * running total by the same amount. The pot total is clamped at zero.
 */
async function recordContribution(
  potId: string,
  amount: number,
  opts: { accountId?: string | null; occurredOn?: string; note?: string | null } = {},
): Promise<ActionResult> {
  const { supabase, user } = await getActionContext();
  const { data: pot, error: readErr } = await supabase
    .from("savings_pots")
    .select("current_amount")
    .eq("id", potId)
    .single();
  if (readErr) return { error: readErr.message };

  const { error: insErr } = await supabase.from("savings_contributions").insert({
    user_id: user.id,
    pot_id: potId,
    account_id: opts.accountId ?? null,
    amount,
    occurred_on: opts.occurredOn || new Date().toISOString().slice(0, 10),
    note: opts.note ?? null,
  });
  if (insErr) return { error: insErr.message };

  const next = Math.max(0, Number(pot.current_amount) + amount);
  const { error: updErr } = await supabase.from("savings_pots").update({ current_amount: next }).eq("id", potId);
  if (updErr) return { error: updErr.message };

  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return {};
}

/** Quick adjust a pot balance (the + / − buttons on a pot card). */
export async function adjustPot(id: string, delta: number): Promise<ActionResult> {
  const { supabase, user } = await getActionContext();
  // Update the balance first so the buttons always work, even if the
  // contributions ledger table isn't present yet.
  const { data: pot, error: readErr } = await supabase
    .from("savings_pots")
    .select("current_amount")
    .eq("id", id)
    .single();
  if (readErr) return { error: readErr.message };
  const next = Math.max(0, Number(pot.current_amount) + delta);
  const { error: updErr } = await supabase.from("savings_pots").update({ current_amount: next }).eq("id", id);
  if (updErr) return { error: updErr.message };

  // Best-effort: record it in the ledger for history. Don't fail the action
  // if this errors (e.g. the savings_contributions table hasn't been added).
  await supabase.from("savings_contributions").insert({
    user_id: user.id,
    pot_id: id,
    amount: delta,
    occurred_on: new Date().toISOString().slice(0, 10),
    note: delta >= 0 ? "Quick add" : "Quick withdrawal",
  });

  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return {};
}

/** Add a contribution / withdrawal from the pot detail form (can be back-dated). */
export async function addContribution(potId: string, raw: SavingsContributionInput): Promise<ActionResult> {
  const parsed = savingsContributionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { amount, direction, account_id, occurred_on, note } = parsed.data;
  const signed = direction === "withdrawal" ? -amount : amount;
  return recordContribution(potId, signed, {
    accountId: account_id || null,
    occurredOn: occurred_on,
    note: note ?? null,
  });
}

/** Remove a contribution and roll its amount back out of the pot total. */
export async function deleteContribution(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { data: row, error: readErr } = await supabase
    .from("savings_contributions")
    .select("amount, pot_id")
    .eq("id", id)
    .single();
  if (readErr) return { error: readErr.message };

  const { error: delErr } = await supabase.from("savings_contributions").delete().eq("id", id);
  if (delErr) return { error: delErr.message };

  const { data: pot, error: potErr } = await supabase
    .from("savings_pots")
    .select("current_amount")
    .eq("id", row.pot_id)
    .single();
  if (potErr) return { error: potErr.message };

  const next = Math.max(0, Number(pot.current_amount) - Number(row.amount));
  const { error: updErr } = await supabase
    .from("savings_pots")
    .update({ current_amount: next })
    .eq("id", row.pot_id);
  if (updErr) return { error: updErr.message };

  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return {};
}

/** Create an account inside a pot, optionally seeding an opening balance. */
export async function createAccount(potId: string, raw: SavingsAccountInput): Promise<ActionResult> {
  const parsed = savingsAccountSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase, user } = await getActionContext();
  const { data: account, error } = await supabase
    .from("savings_accounts")
    .insert({ user_id: user.id, pot_id: potId, name: parsed.data.name, notes: parsed.data.notes ?? null })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const opening = Number(parsed.data.opening_balance ?? 0);
  if (opening > 0) {
    const res = await recordContribution(potId, opening, {
      accountId: account.id,
      occurredOn: parsed.data.opening_date,
      note: "Opening balance",
    });
    if (res?.error) return res;
  }

  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return {};
}

/** Rename an account or edit its notes. */
export async function updateAccount(id: string, raw: SavingsAccountInput): Promise<ActionResult> {
  const parsed = savingsAccountSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase } = await getActionContext();
  const { error } = await supabase
    .from("savings_accounts")
    .update({ name: parsed.data.name, notes: parsed.data.notes ?? null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/savings");
  return {};
}

/**
 * Delete an account. Its contributions are kept (they become "unassigned" via
 * the ON DELETE SET NULL foreign key) so the pot's total is unaffected.
 */
export async function deleteAccount(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("savings_accounts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return {};
}
