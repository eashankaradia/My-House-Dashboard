"use server";

import { revalidatePath } from "next/cache";
import { getActionContext, type ActionResult } from "@/lib/action-utils";
import { ROOMS } from "@/lib/constants";
import type { Room } from "@/lib/database.types";

/**
 * The household's room list. Falls back to the built-in defaults when the
 * table is empty (i.e. the household hasn't customised it yet).
 */
export async function getRooms(): Promise<string[]> {
  const { supabase } = await getActionContext();
  const { data } = await supabase.from("rooms").select("*").order("name");
  const rows = (data ?? []) as Room[];
  if (rows.length === 0) return [...ROOMS];
  return Array.from(new Set(rows.map((r) => r.name)));
}

/** Seed the defaults into the table the first time the list is customised. */
async function ensureSeeded(): Promise<void> {
  const { supabase, user } = await getActionContext();
  const { count } = await supabase.from("rooms").select("id", { count: "exact", head: true });
  if ((count ?? 0) === 0) {
    await supabase.from("rooms").insert(ROOMS.map((name) => ({ user_id: user.id, name })));
  }
}

export async function addRoom(name: string): Promise<ActionResult> {
  const clean = name.trim().slice(0, 60);
  if (!clean) return { error: "Enter a room name" };
  await ensureSeeded();
  const { supabase, user } = await getActionContext();
  const existing = await getRooms();
  if (existing.some((r) => r.toLowerCase() === clean.toLowerCase())) return { error: "That room already exists" };
  const { error } = await supabase.from("rooms").insert({ user_id: user.id, name: clean });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return {};
}

export async function removeRoom(name: string): Promise<ActionResult> {
  await ensureSeeded();
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("rooms").delete().eq("name", name);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return {};
}
