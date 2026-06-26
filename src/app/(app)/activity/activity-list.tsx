"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { formatDate } from "@/lib/utils";
import type { MemberMap } from "@/lib/household";
import type { ActivityLog } from "@/lib/database.types";
import { ACTION_VERB, activityHref, ENTITY_LABEL, ENTITY_TAG } from "./activity-meta";

export function ActivityList({
  activity,
  memberMap,
}: {
  activity: ActivityLog[];
  memberMap: MemberMap;
}) {
  const [userId, setUserId] = React.useState("all");
  const [entityType, setEntityType] = React.useState("all");
  const users = Array.from(new Set(activity.map((item) => item.user_id).filter(Boolean))) as string[];
  const entityTypes = Array.from(new Set(activity.map((item) => item.entity_type))).sort();
  const filtered = activity.filter(
    (item) =>
      (userId === "all" || item.user_id === userId) &&
      (entityType === "all" || item.entity_type === entityType),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <NativeSelect value={userId} onChange={(event) => setUserId(event.target.value)} className="h-9 w-auto">
          <option value="all">All users</option>
          {users.map((id) => (
            <option key={id} value={id}>{memberMap[id] ?? "Unknown user"}</option>
          ))}
        </NativeSelect>
        <NativeSelect value={entityType} onChange={(event) => setEntityType(event.target.value)} className="h-9 w-auto">
          <option value="all">All tabs</option>
          {entityTypes.map((type) => (
            <option key={type} value={type}>{ENTITY_LABEL[type] ?? type}</option>
          ))}
        </NativeSelect>
        <span className="self-center text-sm text-muted-foreground">{filtered.length} updates</span>
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No updates match these filters.</p>
          ) : (
            filtered.map((item) => {
              const href = activityHref(item);
              const content = (
                <>
                  <span className="min-w-0">
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
              const className = "flex items-center justify-between gap-3 px-4 py-3 text-sm";
              return href ? (
                <Link key={item.id} href={href} className={`${className} transition-colors hover:bg-accent active:bg-accent`}>
                  {content}
                </Link>
              ) : (
                <div key={item.id} className={className}>{content}</div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
