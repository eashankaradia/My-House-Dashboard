"use server";

import { getActionContext } from "@/lib/action-utils";
import { revalidatePath } from "next/cache";

// --- Shares --------------------------------------------------------------

export async function createShare(input: { ticker: string; quantity: number; purchase_price: number; purchase_date?: string; notes?: string }) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("shares").insert({
    user_id: user.id,
    ticker: input.ticker.trim().toUpperCase(),
    quantity: input.quantity,
    purchase_price: input.purchase_price,
    purchase_date: input.purchase_date ?? null,
    notes: input.notes ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/finance");
}

export async function updateShare(
  id: string,
  input: Partial<{ ticker: string; quantity: number; purchase_price: number; purchase_date: string | null; notes: string | null }>,
) {
  const { supabase } = await getActionContext();
  const patch = { ...input, updated_at: new Date().toISOString() };
  if (patch.ticker) patch.ticker = patch.ticker.trim().toUpperCase();
  const { error } = await supabase.from("shares").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/finance");
}

export async function deleteShare(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("shares").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/finance");
}

// --- Income: fixed salary details + monthly net income/bonus log -----------

export async function upsertSalaryDetails(input: { annualSalary?: number | null; employer?: string; salaryNotes?: string }) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("finance_settings").upsert(
    {
      user_id: user.id,
      annual_salary: input.annualSalary ?? null,
      employer: input.employer?.trim() || null,
      salary_notes: input.salaryNotes?.trim() || null,
    },
    { onConflict: "user_id" },
  );
  if (error) return { error: error.message };
  revalidatePath("/finance");
}

export async function upsertIncomeMonth(input: { month: string; net_income: number; bonus?: number; notes?: string }) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("income_months").upsert(
    {
      user_id: user.id,
      month: input.month,
      net_income: input.net_income,
      bonus: input.bonus ?? 0,
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,month" },
  );
  if (error) return { error: error.message };
  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

export async function deleteIncomeMonth(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("income_months").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

// --- Credit cards ------------------------------------------------------------

export async function createCreditCard(input: { name: string; last4?: string; statement_day?: number; notes?: string }) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("credit_cards").insert({
    user_id: user.id,
    name: input.name,
    last4: input.last4 ?? null,
    statement_day: input.statement_day ?? null,
    notes: input.notes ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/finance");
}

export async function updateCreditCard(
  id: string,
  input: Partial<{ name: string; last4: string | null; statement_day: number | null; notes: string | null }>,
) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("credit_cards").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/finance");
}

export async function deleteCreditCard(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("credit_cards").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/finance");
}

export async function upsertCreditCardStatement(
  cardId: string,
  input: { statement_month: string; amount: number; is_paid?: boolean; notes?: string },
) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("credit_card_statements").upsert(
    {
      user_id: user.id,
      card_id: cardId,
      statement_month: input.statement_month,
      amount: input.amount,
      is_paid: input.is_paid ?? false,
      notes: input.notes ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "card_id,statement_month" },
  );
  if (error) return { error: error.message };
  revalidatePath("/finance");
}

export async function deleteCreditCardStatement(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("credit_card_statements").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/finance");
}

