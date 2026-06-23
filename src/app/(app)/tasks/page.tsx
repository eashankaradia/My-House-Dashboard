import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { getHouseholdMap } from "@/lib/household";
import type { Project, ProjectTask } from "@/lib/database.types";
import { TasksView } from "./tasks-view";

export const metadata = { title: "Tasks" };

export default async function TasksPage() {
  const supabase = await createClient();
  const [{ data: taskData }, { data: projectData }, memberMap] = await Promise.all([
    supabase
      .from("project_tasks")
      .select("*")
      .order("is_done", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name").order("name"),
    getHouseholdMap(),
  ]);

  const tasks = (taskData ?? []) as ProjectTask[];
  const projects = ((projectData ?? []) as Pick<Project, "id" | "name">[]).map((p) => ({
    id: p.id,
    name: p.name,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Everything to do — standalone or tied to a project."
        info="Add quick to-dos here. Link a task to a project (it'll also show as a project sub-task) or leave it standalone. Give it a due date and use the calendar icon to add it to your Google or Apple calendar."
      />
      <TasksView tasks={tasks} projects={projects} memberMap={memberMap} />
    </div>
  );
}
