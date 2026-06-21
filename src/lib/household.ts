import { createClient } from "@/lib/supabase/server";
import type { HouseholdMember } from "@/lib/database.types";

export type MemberMap = Record<string, string>;

/**
 * Returns a map of user_id → display name for everyone in the household, used
 * to show "Added by …" attribution on items. Empty if the household feature
 * hasn't been set up yet.
 */
export async function getHouseholdMap(): Promise<MemberMap> {
  const supabase = await createClient();
  const { data } = await supabase.from("household_members").select("user_id, display_name");
  const map: MemberMap = {};
  for (const m of (data ?? []) as HouseholdMember[]) {
    map[m.user_id] = m.display_name;
  }
  return map;
}

/** Friendly creator label, falling back gracefully when names are unknown. */
export function addedByLabel(map: MemberMap, userId: string | null): string | null {
  if (!userId) return null;
  return map[userId] ?? null;
}
