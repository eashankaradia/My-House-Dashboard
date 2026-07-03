"use server";

import { getActionContext } from "@/lib/action-utils";
import { revalidatePath } from "next/cache";

export async function logHealthRecord(input: {
  record_type: string;
  value?: number;
  value2?: number;
  unit?: string;
  notes?: string;
  recorded_at?: string;
}) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("health_records").insert({
    user_id: user.id,
    record_type: input.record_type,
    value: input.value ?? null,
    value2: input.value2 ?? null,
    unit: input.unit ?? null,
    notes: input.notes ?? null,
    recorded_at: input.recorded_at ?? new Date().toISOString(),
  });
  if (error) return { error: error.message };
  revalidatePath("/health");
  revalidatePath("/dashboard");
}

export async function deleteHealthRecord(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("health_records").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/health");
}

export async function createMedication(input: {
  name: string;
  dosage?: string;
  frequency?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
}) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("medications").insert({
    user_id: user.id,
    name: input.name,
    dosage: input.dosage ?? null,
    frequency: input.frequency ?? null,
    start_date: input.start_date ?? null,
    end_date: input.end_date ?? null,
    notes: input.notes ?? null,
    is_active: true,
  });
  if (error) return { error: error.message };
  revalidatePath("/health");
}

export async function updateMedication(id: string, input: Partial<{ name: string; dosage: string; frequency: string; is_active: boolean; notes: string }>) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("medications").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/health");
}

export async function deleteMedication(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("medications").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/health");
}

export async function createAppointment(input: {
  title: string;
  provider?: string;
  appointment_date: string;
  appointment_time?: string;
  location?: string;
  notes?: string;
}) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("appointments").insert({
    user_id: user.id,
    title: input.title,
    provider: input.provider ?? null,
    appointment_date: input.appointment_date,
    appointment_time: input.appointment_time ?? null,
    location: input.location ?? null,
    notes: input.notes ?? null,
    status: "Upcoming",
  });
  if (error) return { error: error.message };
  revalidatePath("/health");
  revalidatePath("/dashboard");
}

export async function updateAppointment(id: string, input: Partial<{ title: string; provider: string; appointment_date: string; appointment_time: string; location: string; status: string; notes: string }>) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("appointments").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/health");
}

export async function deleteAppointment(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/health");
}

export async function createHealthInspiration(input: {
  kind: string;
  title: string;
  url?: string;
  image_url?: string;
  source?: string;
  content?: string;
}) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("health_inspiration").insert({
    user_id: user.id,
    kind: input.kind,
    title: input.title,
    url: input.url ?? null,
    image_url: input.image_url ?? null,
    source: input.source ?? null,
    content: input.content ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/health");
}

export async function updateHealthInspiration(
  id: string,
  input: Partial<{ kind: string; title: string; url: string | null; image_url: string | null; source: string | null; content: string | null }>,
) {
  const { supabase } = await getActionContext();
  const { error } = await supabase
    .from("health_inspiration")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/health");
}

export async function deleteHealthInspiration(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("health_inspiration").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/health");
}
