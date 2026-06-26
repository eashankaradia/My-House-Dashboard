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
import type { Bill, BillPayment } from "@/lib/database.types";

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
    is_paid: true,
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

// --- Auto-logged due payments + mark-as-paid -------------------------------

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function stepDate(date: Date, freq: string, dir: 1 | -1): Date {
  const d = new Date(date);
  switch (freq) {
    case "weekly": d.setDate(d.getDate() + 7 * dir); break;
    case "monthly": d.setMonth(d.getMonth() + dir); break;
    case "quarterly": d.setMonth(d.getMonth() + 3 * dir); break;
    case "annually": d.setMonth(d.getMonth() + 12 * dir); break;
    default: d.setFullYear(d.getFullYear() + 100 * dir); // one-off: no real recurrence
  }
  return d;
}

/**
 * Generate the schedule of due payments — the next occurrence plus up to 12
 * months of history — inserting any that don't exist yet as unpaid. Pass a
 * `billId` to sync just one bill (cheap, used when opening a bill). Returns how
 * many rows were created so callers only refresh when something changed.
 * Idempotent and safe to call repeatedly.
 */
export async function syncBillPayments(billId?: string): Promise<ActionResult & { inserted?: number }> {
  const { supabase, user } = await getActionContext();
  let billsQuery = supabase.from("bills").select("*");
  if (billId) billsQuery = billsQuery.eq("id", billId);
  const { data: billRows } = await billsQuery;
  let existingQuery = supabase.from("bill_payments").select("bill_id, payment_date");
  if (billId) existingQuery = existingQuery.eq("bill_id", billId);
  const { data: existing } = await existingQuery;
  const have = new Set((existing ?? []).map((p) => `${p.bill_id}|${p.payment_date}`));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setMonth(horizon.getMonth() - 12);

  const toInsert: Partial<BillPayment>[] = [];
  for (const b of (billRows ?? []) as Bill[]) {
    if (!b.due_date) continue;
    const end = b.end_date ? new Date(b.end_date) : null;
    const add = (d: Date) => {
      const ds = ymd(d);
      if (end && d > end) return;
      if (have.has(`${b.id}|${ds}`)) return;
      have.add(`${b.id}|${ds}`);
      toInsert.push({
        user_id: user.id,
        bill_id: b.id,
        payment_date: ds,
        expected_amount: b.amount,
        actual_amount: null,
        is_paid: false,
      });
    };

    if (b.frequency === "one-off") {
      add(new Date(b.due_date));
      continue;
    }
    // Start at the bill's due date (the next occurrence) and walk backwards.
    let cur = new Date(b.due_date);
    add(cur);
    cur = stepDate(cur, b.frequency, -1);
    let guard = 0;
    while (cur >= horizon && guard < 70) {
      add(cur);
      cur = stepDate(cur, b.frequency, -1);
      guard += 1;
    }
  }

  if (toInsert.length) {
    const { error } = await supabase.from("bill_payments").insert(toInsert);
    if (error) return { error: error.message };
    revalidatePath("/bills");
  }
  return { inserted: toInsert.length };
}

/** Mark a single payment paid/unpaid (defaults actual to expected when paid). */
export async function setPaymentPaid(id: string, paid: boolean): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { data } = await supabase.from("bill_payments").select("expected_amount, actual_amount").eq("id", id).single();
  const actual = paid ? (data?.actual_amount ?? data?.expected_amount ?? null) : data?.actual_amount ?? null;
  const { error } = await supabase.from("bill_payments").update({ is_paid: paid, actual_amount: actual }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/bills");
  revalidatePath("/dashboard");
  return {};
}

/** Mark every past-due unpaid payment as paid (optionally for one bill). */
export async function markHistoryPaid(billId?: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  let query = supabase
    .from("bill_payments")
    .update({ is_paid: true })
    .eq("is_paid", false)
    .lte("payment_date", ymd(new Date()));
  if (billId) query = query.eq("bill_id", billId);
  const { error } = await query;
  if (error) return { error: error.message };
  revalidatePath("/bills");
  revalidatePath("/dashboard");
  return {};
}

/** Edit a payment's actual amount, account and note (e.g. on an upcoming one). */
export async function updateBillPaymentDetail(
  id: string,
  detail: { actual_amount?: number | null; account_id?: string | null; notes?: string | null },
): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const patch: Partial<BillPayment> = {};
  if ("actual_amount" in detail) patch.actual_amount = detail.actual_amount ?? null;
  if ("account_id" in detail) patch.account_id = detail.account_id || null;
  if ("notes" in detail) patch.notes = detail.notes || null;
  const { error } = await supabase.from("bill_payments").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/bills");
  return {};
}
