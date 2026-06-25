"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Pencil } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { AddedBy } from "@/components/shared/added-by";
import { CardTrigger } from "@/components/shared/card-trigger";
import { useToast } from "@/hooks/use-toast";
import { PROJECT_STATUSES } from "@/lib/constants";
import { priorityVariant, STATUS_ACCENT } from "@/lib/ui";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { MemberMap } from "@/lib/household";
import type { ProjectTask, ProjectWithTasks } from "@/lib/database.types";
import { ProjectForm } from "./project-form";
import { ProjectDetailDialog } from "./project-detail";
import { TasksView } from "../tasks/tasks-view";
import { deleteProject, updateProjectStatus } from "./actions";

export function ProjectsViews({
  projects,
  tasks,
  projectOptions,
  memberMap,
  currentUserId,
}: {
  projects: ProjectWithTasks[];
  tasks: ProjectTask[];
  projectOptions: { id: string; name: string }[];
  memberMap: MemberMap;
  currentUserId: string;
}) {
  const [compact, setCompact] = React.useState(true);
  // A ?project= deep-link opens a project detail dialog, which only mounts in
  // the List tab — so start there when one is present (otherwise default tab).
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("project") ? "list" : "tasks";

  return (
    <Tabs defaultValue={initialTab}>
      <TabsList>
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="kanban">Board</TabsTrigger>
        <TabsTrigger value="list">List</TabsTrigger>
      </TabsList>

      <TabsContent value="tasks">
        <TasksView tasks={tasks} projects={projectOptions} memberMap={memberMap} currentUserId={currentUserId} />
      </TabsContent>

      <TabsContent value="kanban">
        <div className="grid grid-flow-col auto-cols-[minmax(260px,1fr)] gap-4 overflow-x-auto pb-2">
          {PROJECT_STATUSES.map((status) => {
            const items = projects.filter((p) => p.status === status);
            return (
              <div key={status} className="rounded-xl border bg-card/40">
                <div className="flex items-center justify-between border-b px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${STATUS_ACCENT[status]}`} />
                    <span className="text-sm font-medium">{status}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2 p-2">
                  {items.map((project) => (
                    <ProjectCard key={project.id} project={project} memberMap={memberMap} compact />
                  ))}
                  {items.length === 0 ? (
                    <p className="px-2 py-6 text-center text-xs text-muted-foreground">Nothing here</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="list">
        <div className="mb-3 flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">View</span>
          <div className="flex items-center rounded-lg border p-0.5 text-xs">
            <button
              onClick={() => setCompact(false)}
              className={cn("rounded-md px-2 py-1", !compact && "bg-accent")}
            >
              Detailed
            </button>
            <button
              onClick={() => setCompact(true)}
              className={cn("rounded-md px-2 py-1", compact && "bg-accent")}
            >
              Compact
            </button>
          </div>
        </div>

        {compact ? (
          <Card>
            <CardContent className="divide-y p-0">
              {projects.map((project) => {
                const done = project.tasks.filter((t) => t.is_done).length;
                return (
                  <div key={project.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <ProjectDetailDialog project={project} memberMap={memberMap}>
                      <CardTrigger className="flex min-w-0 flex-1 items-center gap-3 rounded-md">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_ACCENT[project.status]}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{project.name}</span>
                            <Badge variant={priorityVariant(project.priority)}>{project.priority}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              {project.status} · {project.category}
                              {project.tasks.length ? ` · ${done}/${project.tasks.length} tasks` : ""}
                            </span>
                            <AddedBy name={memberMap[project.user_id]} />
                          </div>
                        </div>
                        <span className="shrink-0 font-medium">
                          {formatCurrency(project.actual_cost || project.estimated_cost)}
                        </span>
                      </CardTrigger>
                    </ProjectDetailDialog>
                    <div className="flex shrink-0 items-center">
                      <ProjectForm
                        project={project}
                        trigger={
                          <button className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                        }
                      />
                      <ConfirmDelete itemLabel="project" action={deleteProject.bind(null, project.id)} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} memberMap={memberMap} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function ProjectCard({
  project,
  memberMap,
  compact = false,
}: {
  project: ProjectWithTasks;
  memberMap: MemberMap;
  compact?: boolean;
}) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const done = project.tasks.filter((t) => t.is_done).length;

  function move(status: string) {
    startTransition(async () => {
      const res = await updateProjectStatus(project.id, status);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't move", description: res.error });
    });
  }

  return (
    <Card className="shadow-none">
      <CardContent className={compact ? "space-y-2 p-3" : "space-y-3 p-4"}>
        <ProjectDetailDialog project={project} memberMap={memberMap}>
          <CardTrigger className={compact ? "space-y-2 rounded-md" : "space-y-3 rounded-md"}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium hover:underline">{project.name}</span>
                  <Badge variant={priorityVariant(project.priority)}>{project.priority}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {project.category}
                  {project.target_completion_date ? ` · ${formatDate(project.target_completion_date)}` : ""}
                  {project.tasks.length ? ` · ${done}/${project.tasks.length} tasks` : ""}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-medium">{formatCurrency(project.actual_cost || project.estimated_cost)}</p>
                <p className="text-xs text-muted-foreground">{project.actual_cost ? "actual" : "est."}</p>
              </div>
            </div>

            {!compact && project.description ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
            ) : null}
          </CardTrigger>
        </ProjectDetailDialog>

        <div className="flex items-center justify-between gap-2 border-t pt-2">
          <AddedBy name={memberMap[project.user_id]} />
          <div className="flex items-center gap-2">
            <NativeSelect
              value={project.status}
              disabled={pending}
              onChange={(e) => move(e.target.value)}
              className="h-8 w-[130px] text-xs"
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </NativeSelect>
            <ProjectForm
              project={project}
              trigger={
                <button className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              }
            />
            <ConfirmDelete itemLabel="project" action={deleteProject.bind(null, project.id)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

