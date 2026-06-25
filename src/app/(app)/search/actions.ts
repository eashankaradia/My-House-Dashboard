"use server";

import { getActionContext } from "@/lib/action-utils";

export type SearchResult = { type: string; id: string; label: string; href: string };

/** Search the main entities by name/title and return deep-linkable results. */
export async function searchItems(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const { supabase } = await getActionContext();
  const like = `%${q}%`;

  const [bills, projects, tasks, purchases, inspo, maint, docs, pots] = await Promise.all([
    supabase.from("bills").select("id, name").ilike("name", like).limit(5),
    supabase.from("projects").select("id, name").is("archived_at", null).ilike("name", like).limit(5),
    supabase.from("project_tasks").select("id, title").is("archived_at", null).ilike("title", like).limit(5),
    supabase.from("purchases").select("id, name").is("archived_at", null).ilike("name", like).limit(5),
    supabase.from("inspiration").select("id, title").ilike("title", like).limit(5),
    supabase.from("maintenance_tasks").select("id, task").ilike("task", like).limit(5),
    supabase.from("documents").select("id, name").ilike("name", like).limit(5),
    supabase.from("savings_pots").select("id, name").ilike("name", like).limit(5),
  ]);

  const out: SearchResult[] = [];
  for (const b of bills.data ?? []) out.push({ type: "Bill", id: b.id, label: b.name, href: `/bills?item=${b.id}` });
  for (const p of projects.data ?? []) out.push({ type: "Project", id: p.id, label: p.name, href: `/projects?project=${p.id}` });
  for (const t of tasks.data ?? []) out.push({ type: "Task", id: t.id, label: t.title, href: `/projects?task=${t.id}` });
  for (const p of purchases.data ?? []) out.push({ type: "Purchase", id: p.id, label: p.name, href: `/purchases?item=${p.id}` });
  for (const i of inspo.data ?? []) out.push({ type: "Idea", id: i.id, label: i.title, href: `/inspiration?item=${i.id}` });
  for (const m of maint.data ?? []) out.push({ type: "Maintenance", id: m.id, label: m.task, href: `/maintenance?item=${m.id}` });
  for (const d of docs.data ?? []) out.push({ type: "Document", id: d.id, label: d.name, href: `/documents?item=${d.id}` });
  for (const s of pots.data ?? []) out.push({ type: "Savings", id: s.id, label: s.name, href: `/savings?item=${s.id}` });
  return out;
}
