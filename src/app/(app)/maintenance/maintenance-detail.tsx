"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { AddedBy } from "@/components/shared/added-by";
import { ShareButton } from "@/components/shared/share-button";
import { ItemTimestamps } from "@/components/shared/item-timestamps";
import { ItemComments } from "@/components/shared/item-comments";
import { FREQUENCY_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { MemberMap } from "@/lib/household";
import type { MaintenanceTask } from "@/lib/database.types";
import { useOpenFromUrl } from "@/hooks/use-open-from-url";
import { MaintenanceForm } from "./maintenance-form";
import { deleteMaintenance } from "./actions";

export function MaintenanceDetailDialog({
  task,
  memberMap,
  children,
}: {
  task: MaintenanceTask;
  memberMap: MemberMap;
  children: React.ReactNode;
}) {
  const { open, onOpenChange } = useOpenFromUrl(task.id);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {task.task}
            <Badge variant="secondary">{FREQUENCY_LABELS[task.frequency] ?? task.frequency}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Next due" value={formatDate(task.next_due_date)} />
            <Detail label="Last completed" value={formatDate(task.last_completed_date)} />
            <Detail label="Typical cost" value={formatCurrency(task.cost)} />
            <Detail label="Frequency" value={FREQUENCY_LABELS[task.frequency] ?? task.frequency} />
          </div>
          {task.notes ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Notes</p>
              <p className="text-sm">{task.notes}</p>
            </div>
          ) : null}
          <ItemTimestamps createdAt={task.created_at} updatedAt={task.updated_at} />
          <div className="border-t pt-3">
            <ItemComments entityType="maintenance_tasks" entityId={task.id} ownerId={task.user_id} href={`/maintenance?item=${task.id}`} label={task.task} />
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <AddedBy name={memberMap[task.user_id]} />
            <div className="flex items-center gap-2">
              <ShareButton title={task.task} text={`Next due ${formatDate(task.next_due_date)}`} />
              <MaintenanceForm task={task} />
              <ConfirmDelete itemLabel="task" action={deleteMaintenance.bind(null, task.id)} variant="menu" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
