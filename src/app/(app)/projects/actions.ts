"use server";

import { revalidatePath } from "next/cache";
import { projectSchema, type ProjectInput } from "@/lib/schemas";
import { PROJECT_STATUSES } from "@/lib/constants";
import { getActionContext, type ActionResult } from "@/lib/action-utils";
import type { ItemScope } from "@/lib/database.types";

// MyHouse never has a "personal" concept — hard boundary so a personal
// MyLife project/task can never leak into MyHouse, regardless of what the
// client sends.
function enforcedScope(requested: ItemScope): ItemScope {
  return process.env.NEXT_PUBLIC_APP === "house" ? "household" : requested;
}

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
    scope: enforcedScope(values.scope),
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

/** Archive or restore a project (archived projects are hidden from the list). */
export async function setProjectArchived(id: string, archived: boolean): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase
    .from("projects")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return {};
}

/** Restore an archived project (single-arg form for passing to UI). */
export async function restoreProject(id: string): Promise<ActionResult> {
  return setProjectArchived(id, false);
}

/** Restore an archived task. */
export async function restoreTask(id: string): Promise<ActionResult> {
  return setTaskArchived(id, false);
}

// --- Tasks (project sub-tasks + standalone) --------------------------------

export async function addTask(projectId: string, title: string): Promise<ActionResult> {
  return createTask({ title, project_id: projectId });
}

export async function createTask(input: {
  title: string;
  project_id?: string | null;
  due_date?: string | null;
  assigned_to?: string | null;
  notes?: string | null;
  is_bored_task?: boolean;
  is_important?: boolean;
  tags?: string[];
  scope?: ItemScope;
}): Promise<ActionResult> {
  const clean = input.title.trim();
  if (!clean) return { error: "Task can't be empty" };
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("project_tasks").insert({
    user_id: user.id,
    project_id: input.project_id ?? null,
    title: clean,
    due_date: input.due_date || null,
    assigned_to: input.assigned_to || null,
    notes: input.notes || null,
    is_bored_task: input.is_bored_task ?? false,
    is_important: input.is_important ?? false,
    tags: input.tags ?? [],
    scope: enforcedScope(input.scope ?? "household"),
  });
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/calendar");
  return {};
}

export async function updateTask(
  id: string,
  input: {
    title?: string;
    project_id?: string | null;
    due_date?: string | null;
    assigned_to?: string | null;
    notes?: string | null;
    is_bored_task?: boolean;
    is_important?: boolean;
    tags?: string[];
    scope?: ItemScope;
  },
): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const patch: {
    title?: string;
    project_id?: string | null;
    due_date?: string | null;
    assigned_to?: string | null;
    notes?: string | null;
    is_bored_task?: boolean;
    is_important?: boolean;
    tags?: string[];
    scope?: ItemScope;
  } = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.project_id !== undefined) patch.project_id = input.project_id || null;
  if (input.due_date !== undefined) patch.due_date = input.due_date || null;
  if (input.assigned_to !== undefined) patch.assigned_to = input.assigned_to || null;
  if (input.notes !== undefined) patch.notes = input.notes || null;
  if (input.is_bored_task !== undefined) patch.is_bored_task = input.is_bored_task;
  if (input.is_important !== undefined) patch.is_important = input.is_important;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.scope !== undefined) patch.scope = enforcedScope(input.scope);
  const { error } = await supabase.from("project_tasks").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/calendar");
  return {};
}

/**
 * "Clear" completed tasks: archive every done, not-yet-archived task. They stay
 * against their project (and still count toward progress) but leave the active
 * list. Optionally scope to a single project.
 */
export async function clearCompletedTasks(projectId?: string | null): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  let query = supabase
    .from("project_tasks")
    .update({ archived_at: new Date().toISOString() })
    .eq("is_done", true)
    .is("archived_at", null);
  if (projectId) query = query.eq("project_id", projectId);
  const { error } = await query;
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/calendar");
  return {};
}

/** Archive or restore a task (archived tasks are hidden from the list). */
export async function setTaskArchived(id: string, archived: boolean): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase
    .from("project_tasks")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/calendar");
  return {};
}

export async function toggleTask(id: string, isDone: boolean): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("project_tasks").update({ is_done: isDone }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return {};
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("project_tasks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/calendar");
  return {};
}
