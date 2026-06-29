"use client";

import * as React from "react";
import { Check, Pencil, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { ListRow } from "@/components/shared/list-row";
import { useToast } from "@/hooks/use-toast";
import { FREQUENCY_LABELS } from "@/lib/constants";
import { daysUntil, formatCurrency, formatDate } from "@/lib/utils";
import type { MaintenanceTask } from "@/lib/database.types";
import { MaintenanceForm } from "./maintenance-form";
import { completeMaintenance, deleteMaintenance } from "./actions";

export function MaintenanceRow({ task }: { task: MaintenanceTask }) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const days = daysUntil(task.next_due_date);

  function complete() {
    startTransition(async () => {
      const res = await completeMaintenance(task.id);
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't update", description: res.error });
        return;
      }
      toast({ title: "Marked complete", description: "Next due date rolled forward." });
    });
  }

  return (
    <ListRow
      icon={
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Wrench className="h-5 w-5" />
        </span>
      }
      title={task.task}
      meta={
        <>
          {task.next_due_date ? `Due ${formatDate(task.next_due_date)}` : "No due date"}
          {task.last_completed_date ? ` · last done ${formatDate(task.last_completed_date)}` : ""}
          {task.cost ? ` · ${formatCurrency(task.cost)}` : ""}
        </>
      }
      badges={
        <>
          <Badge variant="secondary">{FREQUENCY_LABELS[task.frequency]}</Badge>
          {days !== null ? (
            days < 0 ? (
              <Badge variant="destructive">{Math.abs(days)}d overdue</Badge>
            ) : days <= 30 ? (
              <Badge variant="warning">{days}d</Badge>
            ) : (
              <Badge variant="secondary">{days}d</Badge>
            )
          ) : null}
        </>
      }
      actions={
        <>
          <Button variant="outline" size="sm" onClick={complete} disabled={pending}>
            <Check className="h-4 w-4" /> Done
          </Button>
          <MaintenanceForm
            task={task}
            trigger={
              <button className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            }
          />
          <ConfirmDelete itemLabel="task" action={deleteMaintenance.bind(null, task.id)} />
        </>
      }
    />
  );
}
