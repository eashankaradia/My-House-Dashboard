import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdMap } from "@/lib/household";
import { formatDate } from "@/lib/utils";
import type { ActivityLog } from "@/lib/database.types";
import { ActivityLogCard } from "@/components/shared/activity-log-card";
import { ACTION_VERB, activityHref, ENTITY_LABEL, ENTITY_TAG } from "@/app/(app)/activity/activity-meta";

export async function SectionActivityLog({
  entityTypes,
  title = "Recent updates",
  limit = 20,
  excludeSelf = false,
}: {
  /** Filter to these entity types. Omit to show all household activity. */
  entityTypes?: string[];
  title?: string;
  limit?: number;
  /** When true, hide the current user's own activity (show what others did). */
  excludeSelf?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let query = supabase.from("activity_log").select("*");
  if (entityTypes && entityTypes.length) query = query.in("entity_type", entityTypes);
  if (excludeSelf && user) query = query.neq("user_id", user.id);
  const [{ data }, memberMap] = await Promise.all([
    query.order("created_at", { ascending: false }).limit(Math.max(limit, 2)),
    getHouseholdMap(),
  ]);
  const activity = ((data ?? []) as ActivityLog[]).slice(0, 10);
  const total = (data ?? []).length;

  return (
    <ActivityLogCard title={title} count={total}>
        {activity.length === 0 ? (
          <p className="px-4 pb-5 text-sm text-muted-foreground">No updates recorded for this section yet.</p>
        ) : (
          activity.map((item) => {
            const href = activityHref(item);
            const content = (
              <>
                <span className="min-w-0 truncate">
                  {ENTITY_TAG[item.entity_type] ? (
                    <span className={`mr-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ENTITY_TAG[item.entity_type].className}`}>
                      {ENTITY_TAG[item.entity_type].label}
                    </span>
                  ) : null}
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
    </ActivityLogCard>
  );
}
