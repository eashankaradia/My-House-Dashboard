"use server";

import { getActionContext } from "@/lib/action-utils";
import { revalidatePath } from "next/cache";

export async function upsertFinanceSettings(input: {
  monthlyIncome?: number | null;
  incomeLabel?: string;
}) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("finance_settings").upsert(
    {
      user_id: user.id,
      monthly_income: input.monthlyIncome ?? null,
      income_label: input.incomeLabel || "Monthly income",
    },
    { onConflict: "user_id" },
  );
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

