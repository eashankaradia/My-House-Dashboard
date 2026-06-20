import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string };

/**
 * Shared setup for server actions: resolves the Supabase server client and the
 * signed-in user. Throws if there is no session (callers run behind auth).
 */
export async function getActionContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return { supabase, user };
}

/** Turn comma/space separated tag text into a clean string[]. */
export function parseTags(input?: string | null): string[] {
  if (!input) return [];
  return Array.from(
    new Set(
      input
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  );
}
