"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CheckSquare, Columns3, Hammer, List, Maximize2, Pencil, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NativeSelect } from "@/components/ui/native-select";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { AddedBy } from "@/components/shared/added-by";
import { CardTrigger } from "@/components/shared/card-trigger";
import { EmptyState } from "@/components/shared/empty-state";
import { useToast } from "@/hooks/use-toast";
import { ITEM_SCOPES, ITEM_SCOPE_LABELS, PROJECT_STATUSES } from "@/lib/constants";
import { priorityVariant, STATUS_ACCENT, STATUS_BORDER } from "@/lib/ui";
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
  favoriteTaskIds,
}: {
  projects: ProjectWithTasks[];
  tasks: ProjectTask[];
  projectOptions: { id: string; name: string }[];
  memberMap: MemberMap;
  currentUserId: string;
  favoriteTaskIds: Set<string>;
}) {
  const isLife = process.env.NEXT_PUBLIC_APP === "life";
  const [projectView, setProjectView] = React.useState<"list" | "board">("list");
  const [boardFull, setBoardFull] = React.useState(false);
  const [onlyMine, setOnlyMine] = React.useState(isLife);
  const [scopeFilter, setScopeFilter] = React.useState<"all" | "personal" | "household">("all");
  // A ?project= deep-link opens a project detail dialog (which mounts in the
  // Projects tab), so start there when one is present.
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("project") ? "projects" : "tasks";
  const openTasks = tasks.filter((t) => !t.is_done).length;
  const visibleProjects = projects
    .filter((p) => (onlyMine ? p.user_id === currentUserId : true))
    .filter((p) => (scopeFilter === "all" ? true : p.scope === scopeFilter));
  const showFilter = Object.keys(memberMap).length > 1;

  return (
    <Tabs defaultValue={initialTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="tasks" className="gap-1.5">
          <CheckSquare className="h-4 w-4" /> Tasks{openTasks ? ` (${openTasks})` : ""}
        </TabsTrigger>
        <TabsTrigger value="projects" className="gap-1.5">
          <Hammer className="h-4 w-4" /> Projects{projects.length ? ` (${projects.length})` : ""}
        </TabsTrigger>
      </TabsList>

      {/* Tasks — every to-do, standalone or under a project */}
      <TabsContent value="tasks">
        <p className="mb-3 text-sm text-muted-foreground">
          Quick to-dos and anything tied to a project. Tick them off as you go.
        </p>
        <TasksView tasks={tasks} projects={projectOptions} memberMap={memberMap} currentUserId={currentUserId} favoriteTaskIds={favoriteTaskIds} />
      </TabsContent>

      {/* Projects — bigger pieces of work, each with its own tasks */}
      <TabsContent value="projects">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">Bigger work, each with its own tasks and budget.</p>
          <div className="flex items-center gap-2">
            {isLife ? (
              <div className="flex items-center rounded-lg border p-0.5 text-xs">
                {(["all", "household", "personal"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setScopeFilter(s)}
                    className={cn("rounded-md px-2.5 py-1", scopeFilter === s && "bg-accent")}
                  >
                    {s === "all" ? "All" : ITEM_SCOPE_LABELS[s]}
                  </button>
                ))}
              </div>
            ) : null}
            {showFilter ? (
              <div className="flex items-center rounded-lg border p-0.5 text-xs">
                <button
                  onClick={() => setOnlyMine(false)}
                  className={cn("rounded-md px-2.5 py-1", !onlyMine && "bg-accent")}
                >
                  All projects
                </button>
                <button
                  onClick={() => setOnlyMine(true)}
                  className={cn("rounded-md px-2.5 py-1", onlyMine && "bg-accent")}
                >
                  Mine
                </button>
              </div>
            ) : null}
            {projectView === "board" ? (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setBoardFull(true)}>
                <Maximize2 className="h-4 w-4" /> Full screen
              </Button>
            ) : null}
            <div className="flex items-center rounded-lg border p-0.5">
              <button
                onClick={() => setProjectView("list")}
                aria-label="List view"
                className={cn("rounded-md p-1.5 text-muted-foreground", projectView === "list" && "bg-accent text-foreground")}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setProjectView("board")}
                aria-label="Board view"
                className={cn("rounded-md p-1.5 text-muted-foreground", projectView === "board" && "bg-accent text-foreground")}
              >
                <Columns3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {visibleProjects.length === 0 ? (
          <EmptyState
            icon={Hammer}
            title={onlyMine ? "No personal projects yet" : "No projects yet"}
            description="Add a project to plan bigger work and break it into tasks."
          >
            <ProjectForm />
          </EmptyState>
        ) : projectView === "board" ? (
          <>
            <div className="grid grid-flow-col auto-cols-[minmax(260px,1fr)] gap-4 overflow-x-auto pb-2">
              {PROJECT_STATUSES.map((status) => {
                const items = visibleProjects.filter((p) => p.status === status);
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
            {boardFull ? (
              <BoardFullScreen projects={visibleProjects} memberMap={memberMap} onClose={() => setBoardFull(false)} />
            ) : null}
          </>
        ) : (
          <div className="space-y-3">
            {visibleProjects.map((project) => (
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
  const total = project.tasks.length;
  const done = project.tasks.filter((t) => t.is_done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  function move(status: string) {
    startTransition(async () => {
      const res = await updateProjectStatus(project.id, status);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't move", description: res.error });
    });
  }

  return (
    <Card className={cn("shadow-none", !compact && `border-l-4 ${STATUS_BORDER[project.status] ?? ""}`)}>
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
                  {project.status} · {project.category}
                  {project.target_completion_date ? ` · ${formatDate(project.target_completion_date)}` : ""}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-medium">{formatCurrency(project.actual_cost || project.estimated_cost)}</p>
                <p className="text-xs text-muted-foreground">{project.actual_cost ? "actual" : "est."}</p>
              </div>
            </div>

            {/* Task progress — the at-a-glance "how far along is this" */}
            {total > 0 ? (
              <div className="space-y-1">
                <Progress value={pct} />
                <p className="text-xs text-muted-foreground">{done}/{total} tasks done</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No tasks yet</p>
            )}

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

/** A full-screen, mobile-friendly board: statuses stacked vertically. */
function BoardFullScreen({
  projects,
  memberMap,
  onClose,
}: {
  projects: ProjectWithTasks[];
  memberMap: MemberMap;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-base font-semibold">Project board</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close full screen"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {PROJECT_STATUSES.map((status) => {
          const items = projects.filter((p) => p.status === status);
          return (
            <section key={status}>
              <div className="mb-2 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_ACCENT[status]}`} />
                <h3 className="text-sm font-medium">{status}</h3>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.length ? (
                  items.map((project) => (
                    <ProjectCard key={project.id} project={project} memberMap={memberMap} compact />
                  ))
                ) : (
                  <p className="px-1 py-2 text-xs text-muted-foreground">Nothing here</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
