import Link from "next/link";
import { History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdMap } from "@/lib/household";
import { formatDate } from "@/lib/utils";
import type { ActivityLog } from "@/lib/database.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACTION_VERB, activityHref, ENTITY_LABEL } from "@/app/(app)/activity/activity-meta";

export async function SectionActivityLog({
  entityTypes,
  title = "Recent updates",
}: {
  entityTypes: string[];
  title?: string;
}) {
  const supabase = await createClient();
  const [{ data }, memberMap] = await Promise.all([
    supabase
      .from("activity_log")
      .select("*")
      .in("entity_type", entityTypes)
      .order("created_at", { ascending: false })
      .limit(20),
    getHouseholdMap(),
  ]);
  const activity = (data ?? []) as ActivityLog[];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-muted-foreground" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y p-0">
        {activity.length === 0 ? (
          <p className="px-4 pb-5 text-sm text-muted-foreground">No updates recorded for this section yet.</p>
        ) : (
          activity.map((item) => {
            const href = activityHref(item);
            const content = (
              <>
                <span className="min-w-0 truncate">
                  <span className="font-medium">{(item.user_id && memberMap[item.user_id]) || "Someone"}</span>{" "}
                  {ACTION_VERB[item.action] ?? item.action} {ENTITY_LABEL[item.entity_type] ?? item.entity_type}
                  {item.entity_label ? <span className="text-muted-foreground"> “{item.entity_label}”</span> : null}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
              </>
            );
            const className = "flex items-center justify-between gap-3 px-4 py-2.5 text-sm";
            return href ? (
              <Link key={item.id} href={href} className={`${className} hover:bg-accent`}>
                {content}
              </Link>
            ) : (
              <div key={item.id} className={className}>{content}</div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
