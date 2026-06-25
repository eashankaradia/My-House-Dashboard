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
import { priorityVariant } from "@/lib/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { MemberMap } from "@/lib/household";
import type { ProjectWithTasks } from "@/lib/database.types";
import { ProjectForm } from "./project-form";
import { useOpenFromUrl } from "@/hooks/use-open-from-url";
import { LinkedItems } from "@/app/(app)/links/linked-items";
import { Subtasks } from "./subtasks";
import { deleteProject } from "./actions";

export function ProjectDetailDialog({
  project,
  memberMap,
  children,
}: {
  project: ProjectWithTasks;
  memberMap: MemberMap;
  children: React.ReactNode;
}) {
  const { open, onOpenChange } = useOpenFromUrl(project.id, "project");
  const done = project.tasks.filter((t) => t.is_done).length;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {project.name}
            <Badge variant={priorityVariant(project.priority)}>{project.priority}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {project.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.image_url} alt={project.name} className="max-h-56 w-full rounded-lg object-cover" />
          ) : null}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Status" value={project.status} />
            <Detail label="Category" value={project.category} />
            <Detail label="Estimated" value={formatCurrency(project.estimated_cost)} />
            <Detail label="Actual" value={formatCurrency(project.actual_cost)} />
            <Detail label="Target date" value={formatDate(project.target_completion_date)} />
            <Detail label="Sub-tasks" value={`${done}/${project.tasks.length} done`} />
          </div>

          {project.description ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Description</p>
              <p className="text-sm">{project.description}</p>
            </div>
          ) : null}
          {project.notes ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Notes</p>
              <p className="text-sm">{project.notes}</p>
            </div>
          ) : null}

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Sub-tasks</p>
            <Subtasks project={project} />
          </div>

          <div className="border-t pt-3">
            <LinkedItems type="project" id={project.id} />
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <AddedBy name={memberMap[project.user_id]} />
            <div className="flex items-center gap-2">
              <ProjectForm project={project} />
              <ConfirmDelete itemLabel="project" action={deleteProject.bind(null, project.id)} variant="menu" />
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
