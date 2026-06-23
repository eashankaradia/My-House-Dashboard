import { History } from "lucide-react";
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
  collections: "collection",
  inspiration: "idea",
  projects: "project",
  project_tasks: "task",
  purchases: "purchase",
  maintenance_tasks: "maintenance task",
  documents: "document",
};
const ACTION_VERB: Record<string, string> = { insert: "added", update: "updated", delete: "removed" };

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
            {activity.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="font-medium">{(a.user_id && memberMap[a.user_id]) || "Someone"}</span>{" "}
                  {ACTION_VERB[a.action] ?? a.action} {ENTITY_LABEL[a.entity_type] ?? a.entity_type}
                  {a.entity_label ? (
                    <span className="text-muted-foreground"> “{a.entity_label}”</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
