"use server";

import { getActionContext } from "@/lib/action-utils";
import { NAV_ITEMS } from "@/lib/constants";

export type SearchResult = { type: string; id: string; label: string; href: string };

/**
 * Static destinations (pages + settings sections) so search can take you
 * anywhere in the app, not just to data records.
 */
const PAGES: { label: string; href: string; keywords?: string }[] = [
  ...NAV_ITEMS.map((n) => ({ label: n.title, href: n.href, keywords: `${n.short ?? ""} ${n.description}` })),
  { label: "Settings", href: "/settings", keywords: "preferences account" },
  { label: "Settings · Profile & display name", href: "/settings", keywords: "name colour theme" },
  { label: "Settings · Appearance & dark mode", href: "/settings", keywords: "theme dark light mode" },
  { label: "Settings · Sidebar tabs", href: "/settings", keywords: "hide show tabs" },
  { label: "Settings · Bottom bar tabs", href: "/settings", keywords: "phone mobile tabs" },
  { label: "Settings · Dashboard glance stats", href: "/settings", keywords: "stats headline" },
  { label: "Settings · Rooms", href: "/settings", keywords: "rooms add remove" },
  { label: "Settings · Default views", href: "/settings", keywords: "table compact detailed default" },
  { label: "Settings · Notifications", href: "/settings", keywords: "notification preferences inbox" },
  { label: "Settings · Export data", href: "/settings", keywords: "csv download export" },
  { label: "Settings · Household members", href: "/settings", keywords: "members people sharing" },
];

function pageMatches(q: string): SearchResult[] {
  const ql = q.toLowerCase();
  return PAGES.filter(
    (p) => p.label.toLowerCase().includes(ql) || (p.keywords ?? "").toLowerCase().includes(ql),
  ).map((p, i) => ({ type: "Page", id: `page-${i}`, label: p.label, href: p.href }));
}

const isLife = process.env.NEXT_PUBLIC_APP === "life";

/** Search the main entities by name/title and return deep-linkable results. */
export async function searchItems(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const { supabase } = await getActionContext();
  const like = `%${q}%`;

  let billsQuery = supabase.from("bills").select("id, name").ilike("name", like).limit(5);
  if (!isLife) billsQuery = billsQuery.eq("scope", "household");

  const [bills, projects, tasks, purchases, inspo, maint, docs, pots] = await Promise.all([
    billsQuery,
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

  // MyLife-only modules — skipped entirely in the MyHouse build (no nav path
  // creates this data there, so searching these tables would only add noise).
  if (isLife) {
    const [recipes, essentials, routineItems, goals, habits, usefulLinks, creditCards, shares] = await Promise.all([
      supabase.from("recipes").select("id, name").ilike("name", like).limit(5),
      supabase.from("essentials").select("id, name").ilike("name", like).limit(5),
      supabase.from("routine_items").select("id, name").ilike("name", like).limit(5),
      supabase.from("goals").select("id, title").ilike("title", like).limit(5),
      supabase.from("habits").select("id, name").ilike("name", like).limit(5),
      supabase.from("useful_links").select("id, title").ilike("title", like).limit(5),
      supabase.from("credit_cards").select("id, name").ilike("name", like).limit(5),
      supabase.from("shares").select("id, ticker").ilike("ticker", like).limit(5),
    ]);
    for (const r of recipes.data ?? []) out.push({ type: "Recipe", id: r.id, label: r.name, href: `/nutrition?recipe=${r.id}` });
    for (const e of essentials.data ?? []) out.push({ type: "Essential", id: e.id, label: e.name, href: `/essentials?essential=${e.id}` });
    for (const r of routineItems.data ?? []) out.push({ type: "Routine", id: r.id, label: r.name, href: `/routine?routine=${r.id}` });
    for (const g of goals.data ?? []) out.push({ type: "Goal", id: g.id, label: g.title, href: `/goals?goal=${g.id}` });
    for (const h of habits.data ?? []) out.push({ type: "Habit", id: h.id, label: h.name, href: `/habits?habit=${h.id}` });
    for (const l of usefulLinks.data ?? []) out.push({ type: "Link", id: l.id, label: l.title, href: `/notes?link=${l.id}` });
    for (const c of creditCards.data ?? []) out.push({ type: "Card", id: c.id, label: c.name, href: `/finance?card=${c.id}` });
    for (const s of shares.data ?? []) out.push({ type: "Share", id: s.id, label: s.ticker, href: `/finance?share=${s.id}` });
  }

  // Pages and settings sections, so search can navigate anywhere.
  out.push(...pageMatches(q));
  return out;
}
