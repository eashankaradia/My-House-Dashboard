"use server";

import { revalidatePath } from "next/cache";
import {
  billPaymentSchema,
  billSchema,
  paymentAccountSchema,
  type BillInput,
  type BillPaymentInput,
  type PaymentAccountInput,
} from "@/lib/schemas";
import { getActionContext, type ActionResult } from "@/lib/action-utils";

function toRow(values: BillInput) {
  return {
    name: values.name,
    category: values.category,
    amount: values.amount,
    frequency: values.frequency,
    due_date: values.due_date ?? null,
    end_date: values.end_date ?? null,
    account_id: values.account_id ?? null,
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

export async function createPaymentAccount(raw: PaymentAccountInput): Promise<ActionResult> {
  const parsed = paymentAccountSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("payment_accounts").insert({
    user_id: user.id,
    name: parsed.data.name,
    owner_user_id: parsed.data.owner_user_id ?? null,
    notes: parsed.data.notes ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/bills");
  return {};
}

export async function updatePaymentAccount(id: string, raw: PaymentAccountInput): Promise<ActionResult> {
  const parsed = paymentAccountSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("payment_accounts").update({
    name: parsed.data.name,
    owner_user_id: parsed.data.owner_user_id ?? null,
    notes: parsed.data.notes ?? null,
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/bills");
  return {};
}

export async function deletePaymentAccount(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("payment_accounts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/bills");
  return {};
}

export async function createBillPayment(
  billId: string,
  raw: BillPaymentInput,
): Promise<ActionResult> {
  const parsed = billPaymentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("bill_payments").insert({
    user_id: user.id,
    bill_id: billId,
    payment_date: parsed.data.payment_date,
    expected_amount: parsed.data.expected_amount,
    actual_amount: parsed.data.actual_amount ?? parsed.data.expected_amount,
    account_id: parsed.data.account_id ?? null,
    notes: parsed.data.notes ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/bills");
  return {};
}

export async function deleteBillPayment(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("bill_payments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/bills");
  return {};
}
