"use server";

import { revalidatePath } from "next/cache";
import { getActionContext, type ActionResult } from "@/lib/action-utils";

export type FavoriteType = "task" | "goal" | "document" | "inspiration";

/** Where each favouritable type's rows live, its label column, and where to link back to. */
const TABLES: Record<FavoriteType, { table: string; labelCol: string; hrefParam: string; path: string }> = {
  task: { table: "project_tasks", labelCol: "title", hrefParam: "task", path: "/projects" },
  goal: { table: "goals", labelCol: "title", hrefParam: "goal", path: "/goals" },
  document: { table: "documents", labelCol: "name", hrefParam: "item", path: "/documents" },
  inspiration: { table: "inspiration", labelCol: "title", hrefParam: "item", path: "/inspiration" },
};

const VALID = new Set<FavoriteType>(["task", "goal", "document", "inspiration"]);

/** Toggle whether (type, id) is pinned for the current user. */
export async function toggleFavorite(entityType: FavoriteType, entityId: string): Promise<ActionResult & { favorited?: boolean }> {
  if (!VALID.has(entityType) || !entityId) return { error: "Invalid item" };
  const { supabase, user } = await getActionContext();

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
    if (error) return { error: error.message };
    revalidatePath("/dashboard");
    revalidatePath(TABLES[entityType].path);
    return { favorited: false };
  }

  const { error } = await supabase.from("favorites").insert({ user_id: user.id, entity_type: entityType, entity_id: entityId });
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath(TABLES[entityType].path);
  return { favorited: true };
}

/** Ids of everything of `entityType` the current user has pinned. */
export async function getFavoriteIds(entityType: FavoriteType): Promise<Set<string>> {
  if (!VALID.has(entityType)) return new Set();
  const { supabase, user } = await getActionContext();
  const { data } = await supabase.from("favorites").select("entity_id").eq("user_id", user.id).eq("entity_type", entityType);
  return new Set((data ?? []).map((f) => f.entity_id as string));
}

export type PinnedItem = { type: FavoriteType; id: string; label: string; href: string };

/** Every pinned item across every type, resolved to a label + deep link, for the dashboard. */
export async function getPinnedItems(): Promise<PinnedItem[]> {
  const { supabase, user } = await getActionContext();
  const { data } = await supabase
    .from("favorites")
    .select("entity_type, entity_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const favorites = (data ?? []) as { entity_type: string; entity_id: string }[];
  if (favorites.length === 0) return [];

  const byType = new Map<FavoriteType, string[]>();
  for (const f of favorites) {
    if (!VALID.has(f.entity_type as FavoriteType)) continue;
    const t = f.entity_type as FavoriteType;
    byType.set(t, [...(byType.get(t) ?? []), f.entity_id]);
  }

  // Dynamic table/column names — use an untyped view of the query builder.
  const db = supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => { in: (col: string, vals: string[]) => Promise<{ data: Record<string, string>[] | null }> };
    };
  };

  const labels = new Map<string, string>(); // `${type}:${id}` -> label
  for (const [t, ids] of byType) {
    const meta = TABLES[t];
    const { data: rows } = await db.from(meta.table).select(`id, ${meta.labelCol}`).in("id", ids);
    for (const r of rows ?? []) labels.set(`${t}:${r.id}`, r[meta.labelCol]);
  }

  return favorites
    .filter((f) => VALID.has(f.entity_type as FavoriteType))
    .map((f) => {
      const type = f.entity_type as FavoriteType;
      const meta = TABLES[type];
      return {
        type,
        id: f.entity_id,
        label: labels.get(`${type}:${f.entity_id}`) ?? "",
        href: `${meta.path}?${meta.hrefParam}=${f.entity_id}`,
      };
    })
    .filter((p) => p.label);
}
