"use server";

import { revalidatePath } from "next/cache";
import { projectSchema, type ProjectInput } from "@/lib/schemas";
import { PROJECT_STATUSES } from "@/lib/constants";
import { getActionContext, type ActionResult } from "@/lib/action-utils";

function toRow(values: ProjectInput) {
  return {
    name: values.name,
    category: values.category,
    description: values.description ?? null,
    estimated_cost: values.estimated_cost,
    actual_cost: values.actual_cost,
    priority: values.priority,
    status: values.status,
    target_completion_date: values.target_completion_date ?? null,
    notes: values.notes ?? null,
    image_url: values.image_url ?? null,
  };
}

export async function createProject(raw: ProjectInput): Promise<ActionResult> {
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("projects").insert({ ...toRow(parsed.data), user_id: user.id });
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return {};
}

export async function updateProject(id: string, raw: ProjectInput): Promise<ActionResult> {
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("projects").update(toRow(parsed.data)).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return {};
}

export async function updateProjectStatus(id: string, status: string): Promise<ActionResult> {
  if (!PROJECT_STATUSES.includes(status as (typeof PROJECT_STATUSES)[number])) {
    return { error: "Invalid status" };
  }
  const { supabase } = await getActionContext();
  const { error } = await supabase
    .from("projects")
    .update({ status: status as (typeof PROJECT_STATUSES)[number] })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return {};
}

// --- Tasks (project sub-tasks + standalone) --------------------------------

export async function addTask(projectId: string, title: string): Promise<ActionResult> {
  return createTask({ title, project_id: projectId });
}

export async function createTask(input: {
  title: string;
  project_id?: string | null;
  due_date?: string | null;
}): Promise<ActionResult> {
  const clean = input.title.trim();
  if (!clean) return { error: "Task can't be empty" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("project_tasks").insert({
    user_id: user.id,
    project_id: input.project_id ?? null,
    title: clean,
    due_date: input.due_date || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  return {};
}

export async function updateTask(
  id: string,
  input: { title?: string; project_id?: string | null; due_date?: string | null },
): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const patch: { title?: string; project_id?: string | null; due_date?: string | null } = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.project_id !== undefined) patch.project_id = input.project_id || null;
  if (input.due_date !== undefined) patch.due_date = input.due_date || null;
  const { error } = await supabase.from("project_tasks").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  return {};
}

export async function toggleTask(id: string, isDone: boolean): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("project_tasks").update({ is_done: isDone }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/tasks");
  return {};
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("project_tasks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  return {};
}
