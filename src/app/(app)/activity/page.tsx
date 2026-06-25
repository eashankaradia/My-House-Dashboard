import { History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getHouseholdMap } from "@/lib/household";
import type { ActivityLog } from "@/lib/database.types";
import { ActivityList } from "./activity-list";

export const metadata = { title: "Change log" };

export default async function ActivityPage() {
  const supabase = await createClient();
  const [{ data: activityData }, memberMap] = await Promise.all([
    supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(200),
    getHouseholdMap(),
  ]);
  const activity = (activityData ?? []) as ActivityLog[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Change log"
        description="Who changed what across your home, and when."
        info="Filter the running record by household member or app tab. The most recent changes appear first."
      />
      {activity.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity yet"
          description="Add or edit anything across the app and it'll show up here, tagged with who did it and when."
        />
      ) : (
        <ActivityList activity={activity} memberMap={memberMap} />
      )}
    </div>
  );
}
