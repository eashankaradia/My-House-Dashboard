"use server";

import { revalidatePath } from "next/cache";
import { maintenanceSchema, type MaintenanceInput } from "@/lib/schemas";
import { getActionContext, type ActionResult } from "@/lib/action-utils";

const FREQUENCY_DAYS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 91,
  biannually: 182,
  annually: 365,
};

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Derive a next-due date from last-completed + frequency if not set explicitly. */
function deriveNextDue(values: MaintenanceInput): string | null {
  if (values.next_due_date) return values.next_due_date;
  if (values.last_completed_date) {
    return addDays(new Date(values.last_completed_date), FREQUENCY_DAYS[values.frequency] ?? 365);
  }
  return null;
}

function toRow(values: MaintenanceInput) {
  return {
    task: values.task,
    frequency: values.frequency,
    last_completed_date: values.last_completed_date ?? null,
    next_due_date: deriveNextDue(values),
    cost: values.cost,
    notes: values.notes ?? null,
  };
}

export async function createMaintenance(raw: MaintenanceInput): Promise<ActionResult> {
  const parsed = maintenanceSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase
    .from("maintenance_tasks")
    .insert({ ...toRow(parsed.data), user_id: user.id });
  if (error) return { error: error.message };
  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
  return {};
}

export async function updateMaintenance(id: string, raw: MaintenanceInput): Promise<ActionResult> {
  const parsed = maintenanceSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("maintenance_tasks").update(toRow(parsed.data)).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
  return {};
}

/** Mark a task done today and roll the next due date forward by its frequency. */
export async function completeMaintenance(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { data, error: readErr } = await supabase
    .from("maintenance_tasks")
    .select("frequency")
    .eq("id", id)
    .single();
  if (readErr || !data) return { error: readErr?.message ?? "Not found" };

  const today = new Date();
  const next = addDays(today, FREQUENCY_DAYS[data.frequency] ?? 365);
  const { error } = await supabase
    .from("maintenance_tasks")
    .update({ last_completed_date: today.toISOString().slice(0, 10), next_due_date: next })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteMaintenance(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("maintenance_tasks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
  return {};
}
