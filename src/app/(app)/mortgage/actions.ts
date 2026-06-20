"use server";

import { revalidatePath } from "next/cache";
import { mortgageSchema, type MortgageInput } from "@/lib/schemas";
import { getActionContext, type ActionResult } from "@/lib/action-utils";

function toRow(values: MortgageInput) {
  return {
    property_name: values.property_name,
    property_value: values.property_value,
    mortgage_balance: values.mortgage_balance,
    interest_rate: values.interest_rate,
    monthly_payment: values.monthly_payment,
    term_months: values.term_months ?? null,
    start_date: values.start_date ?? null,
    fixed_term_end_date: values.fixed_term_end_date ?? null,
    provider: values.provider ?? null,
    notes: values.notes ?? null,
  };
}

/** Create a new mortgage or update the existing one when `id` is provided. */
export async function saveMortgage(id: string | null, raw: MortgageInput): Promise<ActionResult> {
  const parsed = mortgageSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const { supabase, user } = await getActionContext();
  const error = id
    ? (await supabase.from("mortgages").update(toRow(parsed.data)).eq("id", id)).error
    : (await supabase.from("mortgages").insert({ ...toRow(parsed.data), user_id: user.id })).error;
  if (error) return { error: error.message };

  revalidatePath("/mortgage");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteMortgage(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("mortgages").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/mortgage");
  revalidatePath("/dashboard");
  return {};
}
