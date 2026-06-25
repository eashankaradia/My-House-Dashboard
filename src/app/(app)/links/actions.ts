"use server";

import { revalidatePath } from "next/cache";
import { getActionContext, type ActionResult } from "@/lib/action-utils";
import type { Link, LinkType } from "@/lib/database.types";

/** Where each entity type's rows live, and which column holds its label. */
const TABLES: Record<LinkType, { table: string; labelCol: string }> = {
  task: { table: "project_tasks", labelCol: "title" },
  project: { table: "projects", labelCol: "name" },
  purchase: { table: "purchases", labelCol: "name" },
  bill: { table: "bills", labelCol: "name" },
  inspiration: { table: "inspiration", labelCol: "title" },
};

const VALID = new Set<LinkType>(["task", "project", "purchase", "bill", "inspiration"]);

function pathFor(type: LinkType): string {
  switch (type) {
    case "purchase":
      return "/purchases";
    case "bill":
      return "/bills";
    case "inspiration":
      return "/inspiration";
    default:
      return "/projects"; // task + project
  }
}

export type LinkedItem = { linkId: string; type: LinkType; id: string; label: string };

/** Resolve every item linked to (type,id), skipping any whose target is gone. */
export async function getLinks(type: LinkType, id: string): Promise<LinkedItem[]> {
  if (!VALID.has(type) || !id) return [];
  const { supabase } = await getActionContext();
  const { data } = await supabase
    .from("links")
    .select("*")
    .or(`and(a_type.eq.${type},a_id.eq.${id}),and(b_type.eq.${type},b_id.eq.${id})`);

  const links = (data ?? []) as Link[];
  // The "other" side of each link.
  const others = links.map((l) => {
    const isA = l.a_type === type && l.a_id === id;
    return {
      linkId: l.id,
      type: (isA ? l.b_type : l.a_type) as LinkType,
      id: isA ? l.b_id : l.a_id,
    };
  });

  // Batch-fetch labels per target type.
  const byType = new Map<LinkType, string[]>();
  for (const o of others) {
    byType.set(o.type, [...(byType.get(o.type) ?? []), o.id]);
  }
  const labels = new Map<string, string>(); // `${type}:${id}` -> label
  // Dynamic table/column names — the typed client can't infer these, so use an
  // untyped view of the query builder.
  const db = supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => { in: (col: string, vals: string[]) => Promise<{ data: Record<string, string>[] | null }> };
    };
  };
  for (const [t, ids] of byType) {
    const meta = TABLES[t];
    const { data: rows } = await db.from(meta.table).select(`id, ${meta.labelCol}`).in("id", ids);
    for (const r of rows ?? []) {
      labels.set(`${t}:${r.id}`, r[meta.labelCol]);
    }
  }

  return others
    .map((o) => ({ ...o, label: labels.get(`${o.type}:${o.id}`) ?? "" }))
    .filter((o) => o.label);
}

/** Candidate items of a given type to link to (excludes archived where relevant). */
export async function listLinkTargets(type: LinkType): Promise<{ id: string; label: string }[]> {
  if (!VALID.has(type)) return [];
  const { supabase } = await getActionContext();
  const meta = TABLES[type];
  // Dynamic table/column names — use an untyped view of the query builder.
  const db = supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        order: (c: string) => {
          limit: (n: number) => {
            is: (col: string, v: null) => Promise<{ data: Record<string, string>[] | null }>;
          } & Promise<{ data: Record<string, string>[] | null }>;
        };
      };
    };
  };
  const base = db.from(meta.table).select(`id, ${meta.labelCol}`).order(meta.labelCol).limit(300);
  const archivable = type === "purchase" || type === "project" || type === "task";
  const { data } = await (archivable ? base.is("archived_at", null) : base);
  return (data ?? []).map((r) => ({ id: r.id, label: r[meta.labelCol] }));
}

/** Link two items together (no-op if already linked or linking to itself). */
export async function createLink(
  aType: LinkType,
  aId: string,
  bType: LinkType,
  bId: string,
): Promise<ActionResult> {
  if (!VALID.has(aType) || !VALID.has(bType)) return { error: "Invalid type" };
  if (aType === bType && aId === bId) return { error: "Can't link an item to itself" };
  const { supabase, user } = await getActionContext();

  const { data: existing } = await supabase
    .from("links")
    .select("id")
    .or(
      `and(a_type.eq.${aType},a_id.eq.${aId},b_type.eq.${bType},b_id.eq.${bId}),` +
        `and(a_type.eq.${bType},a_id.eq.${bId},b_type.eq.${aType},b_id.eq.${aId})`,
    )
    .maybeSingle();
  if (existing) return {};

  const { error } = await supabase.from("links").insert({
    user_id: user.id,
    a_type: aType,
    a_id: aId,
    b_type: bType,
    b_id: bId,
  });
  if (error) return { error: error.message };
  revalidatePath(pathFor(aType));
  revalidatePath(pathFor(bType));
  return {};
}

export async function deleteLink(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("links").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/purchases");
  revalidatePath("/bills");
  revalidatePath("/inspiration");
  return {};
}
