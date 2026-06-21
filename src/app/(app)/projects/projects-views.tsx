"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { AddedBy } from "@/components/shared/added-by";
import { ExportButton } from "@/components/shared/export-button";
import { BarChart } from "@/components/charts/bar-chart";
import { useToast } from "@/hooks/use-toast";
import { PROJECT_STATUSES } from "@/lib/constants";
import { priorityVariant, STATUS_ACCENT } from "@/lib/ui";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { MemberMap } from "@/lib/household";
import type { ProjectWithTasks } from "@/lib/database.types";
import { ProjectForm } from "./project-form";
import { ProjectDetailDialog } from "./project-detail";
import { deleteProject, updateProjectStatus } from "./actions";

export function ProjectsViews({
  projects,
  memberMap,
}: {
  projects: ProjectWithTasks[];
  memberMap: MemberMap;
}) {
  const [compact, setCompact] = React.useState(false);

  return (
    <Tabs defaultValue="kanban">
      <TabsList>
        <TabsTrigger value="kanban">Board</TabsTrigger>
        <TabsTrigger value="list">List</TabsTrigger>
        <TabsTrigger value="costs">Costs</TabsTrigger>
      </TabsList>

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
          <ExportButton
            filename="projects"
            rows={projects.map((p) => ({
              name: p.name,
              category: p.category,
              status: p.status,
              priority: p.priority,
              estimated_cost: p.estimated_cost,
              actual_cost: p.actual_cost,
              target_completion_date: p.target_completion_date,
              tasks_total: p.tasks.length,
              tasks_done: p.tasks.filter((t) => t.is_done).length,
            }))}
            columns={[
              "name", "category", "status", "priority", "estimated_cost",
              "actual_cost", "target_completion_date", "tasks_total", "tasks_done",
            ]}
          />
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
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_ACCENT[project.status]}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <ProjectDetailDialog project={project} memberMap={memberMap}>
                          <button className="truncate text-left font-medium hover:underline">{project.name}</button>
                        </ProjectDetailDialog>
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
                    <div className="flex shrink-0 items-center">
                      <ProjectForm
                        project={project}
                        trigger={
                          <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Edit">
                            <Pencil className="h-4 w-4" />
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

      <TabsContent value="costs">
        <CostSummary projects={projects} />
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
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <ProjectDetailDialog project={project} memberMap={memberMap}>
                <button className="truncate text-left font-medium hover:underline">{project.name}</button>
              </ProjectDetailDialog>
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
                <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
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

function CostSummary({ projects }: { projects: ProjectWithTasks[] }) {
  const totalEst = projects.reduce((s, p) => s + Number(p.estimated_cost), 0);
  const totalActual = projects.reduce((s, p) => s + Number(p.actual_cost), 0);

  const byCategory = new Map<string, number>();
  for (const p of projects) {
    const cost = Number(p.actual_cost) || Number(p.estimated_cost);
    byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + cost);
  }
  const data = Array.from(byCategory.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total estimated</p>
            <p className="text-2xl font-semibold">{formatCurrency(totalEst)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total actual spend</p>
            <p className="text-2xl font-semibold">{formatCurrency(totalActual)}</p>
          </CardContent>
        </Card>
      </div>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Cost by category</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length ? (
            <BarChart data={data} multicolor />
          ) : (
            <p className="text-sm text-muted-foreground">No costs recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
