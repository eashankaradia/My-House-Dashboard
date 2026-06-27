import { Hammer } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { getHouseholdMap } from "@/lib/household";
import { ArchivedSection } from "@/components/shared/archived-section";
import type { Project, ProjectTask, ProjectWithTasks } from "@/lib/database.types";
import { ProjectForm } from "./project-form";
import { ProjectsViews } from "./projects-views";
import { SectionActivityLog } from "@/components/shared/section-activity-log";
import { deleteProject, deleteTask, restoreProject, restoreTask } from "./actions";

export const metadata = { title: "Projects & Tasks" };

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data }, { data: taskData }, memberMap] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase
      .from("project_tasks")
      .select("*")
      .order("is_done", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    getHouseholdMap(),
  ]);
  // Archived tasks/projects are hidden from the main lists.
  const allTasks = (taskData ?? []) as ProjectTask[];
  const tasks = allTasks.filter((t) => !t.archived_at);
  const archivedTasks = allTasks.filter((t) => t.archived_at);
  const allProjects = (data ?? []) as Project[];
  const archivedProjects = allProjects.filter((p) => p.archived_at);
  // Project progress counts ALL its tasks (including cleared/archived ones), so
  // clearing completed tasks doesn't lose progress. The interactive lists below
  // still filter archived out for display.
  const projects: ProjectWithTasks[] = allProjects
    .filter((p) => !p.archived_at)
    .map((p) => ({ ...p, tasks: allTasks.filter((t) => t.project_id === p.id) }));
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));
  const currentUserId = user?.id ?? "";

  const active = projects.filter((p) => p.status !== "Completed");
  const openTasks = tasks.filter((t) => !t.is_done).length;
  const hasContent =
    projects.length > 0 || tasks.length > 0 || archivedProjects.length > 0 || archivedTasks.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects & Tasks"
        description="Track your to-dos, and plan bigger projects that hold their own tasks."
        info="Two tabs: Tasks is every to-do (standalone or under a project) — tick them off as you go. Projects is bigger work you can view as a list or a status board, each project showing its task progress and budget. Add a task to a project to see it count towards that project's progress."
      >
        <ProjectForm />
      </PageHeader>

      {!hasContent ? (
        <EmptyState
          icon={Hammer}
          title="Nothing here yet"
          description="Add a project to plan bigger work, or add a quick task in the Tasks tab. Tasks can stand alone or be tied to a project."
        >
          <ProjectForm />
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Active projects" value={String(active.length)} icon={Hammer} />
            <StatCard label="Open tasks" value={String(openTasks)} accent="muted" />
          </div>
          <ProjectsViews
            projects={projects}
            tasks={tasks}
            projectOptions={projectOptions}
            memberMap={memberMap}
            currentUserId={currentUserId}
          />
          <ArchivedSection
            items={archivedProjects.map((p) => ({ id: p.id, label: p.name }))}
            noun="projects"
            onRestore={restoreProject}
            onDelete={deleteProject}
          />
          <ArchivedSection
            items={archivedTasks.map((t) => ({ id: t.id, label: t.title }))}
            noun="tasks"
            onRestore={restoreTask}
            onDelete={deleteTask}
          />
        </>
      )}
      <SectionActivityLog entityTypes={["projects", "project_tasks"]} />
    </div>
  );
}
