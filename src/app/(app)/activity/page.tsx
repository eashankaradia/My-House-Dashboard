import { History } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { getHouseholdMap } from "@/lib/household";
import type { ActivityLog } from "@/lib/database.types";

export const metadata = { title: "Change log" };

const ENTITY_LABEL: Record<string, string> = {
  bills: "bill",
  mortgages: "mortgage",
  savings_pots: "savings pot",
  savings_accounts: "savings account",
  collections: "collection",
  inspiration: "idea",
  projects: "project",
  project_tasks: "task",
  purchases: "purchase",
  maintenance_tasks: "maintenance task",
  documents: "document",
};
const ACTION_VERB: Record<string, string> = { insert: "added", update: "updated", delete: "removed" };

/** The section that holds each entity type. */
const ENTITY_BASE: Record<string, string> = {
  bills: "/bills",
  mortgages: "/mortgage",
  savings_pots: "/savings",
  savings_accounts: "/savings",
  collections: "/inspiration",
  inspiration: "/inspiration",
  projects: "/projects",
  project_tasks: "/projects",
  purchases: "/purchases",
  maintenance_tasks: "/maintenance",
  documents: "/documents",
};

/** Entity types whose detail view can be opened straight from a URL param. */
const ENTITY_PARAM: Record<string, string> = {
  bills: "item",
  savings_pots: "item",
  inspiration: "item",
  purchases: "item",
  maintenance_tasks: "item",
  documents: "item",
  projects: "project",
  project_tasks: "task",
};

/** Deep-link to the exact item where we can; otherwise just its section. */
function activityHref(a: ActivityLog): string | undefined {
  const base = ENTITY_BASE[a.entity_type];
  if (!base) return undefined;
  const param = ENTITY_PARAM[a.entity_type];
  // Skip deletes — the item no longer exists to open.
  if (param && a.entity_id && a.action !== "delete") return `${base}?${param}=${a.entity_id}`;
  return base;
}

export default async function ActivityPage() {
  const supabase = await createClient();
  const [{ data: activityData }, memberMap] = await Promise.all([
    supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(100),
    getHouseholdMap(),
  ]);

  const activity = (activityData ?? []) as ActivityLog[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Change log"
        description="Who changed what across your home, and when."
        info="A running record of everything added, updated or removed by anyone in your household. The most recent changes appear first."
      />

      {activity.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity yet"
          description="Add or edit anything across the app and it'll show up here, tagged with who did it and when."
        />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {activity.map((a) => {
              const href = activityHref(a);
              const inner = (
                <>
                  <span className="min-w-0">
                    <span className="font-medium">{(a.user_id && memberMap[a.user_id]) || "Someone"}</span>{" "}
                    {ACTION_VERB[a.action] ?? a.action} {ENTITY_LABEL[a.entity_type] ?? a.entity_type}
                    {a.entity_label ? (
                      <span className="text-muted-foreground"> “{a.entity_label}”</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
                </>
              );
              const rowClass =
                "flex items-center justify-between gap-3 px-4 py-3 text-sm";
              return href ? (
                <Link
                  key={a.id}
                  href={href}
                  className={rowClass + " transition-colors hover:bg-accent active:bg-accent"}
                >
                  {inner}
                </Link>
              ) : (
                <div key={a.id} className={rowClass}>
                  {inner}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
