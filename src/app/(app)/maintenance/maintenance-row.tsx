"use client";

import * as React from "react";
import { Check, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
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
    <Card className="shadow-none">
      <CardContent className="flex flex-wrap items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{task.task}</p>
            <Badge variant="secondary">{FREQUENCY_LABELS[task.frequency]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {task.next_due_date ? `Due ${formatDate(task.next_due_date)}` : "No due date"}
            {task.last_completed_date ? ` · last done ${formatDate(task.last_completed_date)}` : ""}
            {task.cost ? ` · ${formatCurrency(task.cost)}` : ""}
          </p>
        </div>

        {days !== null ? (
          days < 0 ? (
            <Badge variant="destructive">{Math.abs(days)}d overdue</Badge>
          ) : days <= 30 ? (
            <Badge variant="warning">{days}d</Badge>
          ) : (
            <Badge variant="secondary">{days}d</Badge>
          )
        ) : null}

        <div className="flex items-center gap-1">
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
        </div>
      </CardContent>
    </Card>
  );
}
