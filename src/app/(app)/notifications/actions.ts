"use server";

import { revalidatePath } from "next/cache";
import { getActionContext, type ActionResult } from "@/lib/action-utils";

/** Household members other than the current user (for "point out to…"). */
export async function listOtherMembers(): Promise<{ id: string; name: string }[]> {
  const { supabase, user } = await getActionContext();
  const { data } = await supabase.from("household_members").select("user_id, display_name");
  return (data ?? [])
    .filter((m) => m.user_id !== user.id)
    .map((m) => ({ id: m.user_id, name: m.display_name }));
}

export async function setNotificationPreference(
  entityType: string,
  enabled: boolean,
): Promise<ActionResult> {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("notification_preferences").upsert(
    { user_id: user.id, entity_type: entityType, enabled },
    { onConflict: "user_id,entity_type" },
  );
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return {};
}

export async function sendNotification(
  recipientUserId: string,
  title: string,
  message?: string,
  href?: string,
): Promise<ActionResult> {
  if (!recipientUserId || !title.trim()) return { error: "Recipient and title are required" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("notifications").insert({
    recipient_user_id: recipientUserId,
    sender_user_id: user.id,
    title: title.trim(),
    message: message?.trim() || null,
    href: href?.trim() || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/notifications");
  return {};
}

export async function markNotificationRead(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/notifications");
  return {};
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_user_id", user.id)
    .is("read_at", null);
  if (error) return { error: error.message };
  revalidatePath("/notifications");
  return {};
}
