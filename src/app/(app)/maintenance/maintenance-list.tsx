"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddedBy } from "@/components/shared/added-by";
import { FREQUENCY_LABELS } from "@/lib/constants";
import { cn, daysUntil, formatDate } from "@/lib/utils";
import type { MemberMap } from "@/lib/household";
import type { MaintenanceTask } from "@/lib/database.types";
import { MaintenanceRow } from "./maintenance-row";
import { MaintenanceDetailDialog } from "./maintenance-detail";

export function MaintenanceList({
  tasks,
  memberMap,
}: {
  tasks: MaintenanceTask[];
  memberMap: MemberMap;
}) {
  const [compact, setCompact] = React.useState(true);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Schedule</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border p-0.5 text-xs">
            <button onClick={() => setCompact(false)} className={cn("rounded-md px-2 py-1", !compact && "bg-accent")}>
              Detailed
            </button>
            <button onClick={() => setCompact(true)} className={cn("rounded-md px-2 py-1", compact && "bg-accent")}>
              Compact
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? "divide-y p-0" : "space-y-2"}>
        {tasks.map((task) => {
          if (!compact) return <MaintenanceRow key={task.id} task={task} />;
          const days = daysUntil(task.next_due_date);
          return (
            <div key={task.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <MaintenanceDetailDialog task={task} memberMap={memberMap}>
                    <button className="truncate text-left font-medium hover:underline">{task.task}</button>
                  </MaintenanceDetailDialog>
                  <Badge variant="secondary">{FREQUENCY_LABELS[task.frequency]}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{task.next_due_date ? `Due ${formatDate(task.next_due_date)}` : "No due date"}</span>
                  <AddedBy name={memberMap[task.user_id]} />
                </div>
              </div>
              {days !== null ? (
                days < 0 ? (
                  <Badge variant="destructive">{Math.abs(days)}d late</Badge>
                ) : days <= 30 ? (
                  <Badge variant="warning">{days}d</Badge>
                ) : (
                  <Badge variant="secondary">{days}d</Badge>
                )
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
