import { Hammer } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency } from "@/lib/utils";
import { getHouseholdMap } from "@/lib/household";
import type { Project, ProjectTask, ProjectWithTasks } from "@/lib/database.types";
import { ProjectForm } from "./project-form";
import { ProjectsViews } from "./projects-views";

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
  // Archived tasks are hidden from the main list.
  const allTasks = (taskData ?? []) as ProjectTask[];
  const tasks = allTasks.filter((t) => !t.archived_at);
  const projects: ProjectWithTasks[] = ((data ?? []) as Project[]).map((p) => ({
    ...p,
    tasks: tasks.filter((t) => t.project_id === p.id),
  }));
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));
  const currentUserId = user?.id ?? "";

  const active = projects.filter((p) => p.status !== "Completed");
  const totalEstimated = projects.reduce((s, p) => s + Number(p.estimated_cost), 0);
  const openTasks = tasks.filter((t) => !t.is_done).length;
  const hasContent = projects.length > 0 || tasks.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects & Tasks"
        description="Plan home projects and track every to-do in one place."
        info="The Tasks tab lists everything to do — standalone or tied to a project — with due dates and an add-to-calendar option. The Board, List and Costs tabs manage projects; move a project through Idea → Completed and record estimated vs actual cost."
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
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Active projects" value={String(active.length)} icon={Hammer} />
            <StatCard label="Open tasks" value={String(openTasks)} accent="muted" />
            <StatCard label="Project value" value={formatCurrency(totalEstimated)} accent="muted" />
          </div>
          <ProjectsViews
            projects={projects}
            tasks={tasks}
            projectOptions={projectOptions}
            memberMap={memberMap}
            currentUserId={currentUserId}
          />
        </>
      )}
    </div>
  );
}
