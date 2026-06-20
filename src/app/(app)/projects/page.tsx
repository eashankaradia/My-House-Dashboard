import { Hammer } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency } from "@/lib/utils";
import type { Project } from "@/lib/database.types";
import { ProjectForm } from "./project-form";
import { ProjectsViews } from "./projects-views";

export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  const projects = (data ?? []) as Project[];

  const active = projects.filter((p) => p.status !== "Completed");
  const totalEstimated = projects.reduce((s, p) => s + Number(p.estimated_cost), 0);
  const completed = projects.filter((p) => p.status === "Completed").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" description="Plan and track every home project.">
        <ProjectForm />
      </PageHeader>

      {projects.length === 0 ? (
        <EmptyState
          icon={Hammer}
          title="No projects yet"
          description="Capture ideas and move them across the board from idea to done — with estimated and actual costs."
        >
          <ProjectForm />
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Active projects" value={String(active.length)} icon={Hammer} />
            <StatCard label="Estimated value" value={formatCurrency(totalEstimated)} accent="muted" />
            <StatCard label="Completed" value={String(completed)} accent="muted" />
          </div>
          <ProjectsViews projects={projects} />
        </>
      )}
    </div>
  );
}
