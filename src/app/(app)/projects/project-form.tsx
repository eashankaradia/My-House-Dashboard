"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form-field";
import { ImageUpload } from "@/components/shared/image-upload";
import { useToast } from "@/hooks/use-toast";
import { PRIORITIES, PROJECT_CATEGORIES, PROJECT_STATUSES } from "@/lib/constants";
import { projectSchema, type ProjectInput } from "@/lib/schemas";
import type { Project } from "@/lib/database.types";
import { createProject, deleteProject, setProjectArchived, updateProject } from "./actions";

type Props = {
  project?: Project;
  trigger?: React.ReactNode;
  /** Prefill values, e.g. when converting an inspiration into a project. */
  defaults?: Partial<ProjectInput>;
};

export function ProjectForm({ project, trigger, defaults }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(project);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name ?? defaults?.name ?? "",
      category: project?.category ?? defaults?.category ?? "General",
      description: project?.description ?? defaults?.description ?? "",
      estimated_cost: project?.estimated_cost ?? 0,
      actual_cost: project?.actual_cost ?? 0,
      priority: project?.priority ?? defaults?.priority ?? "Low",
      status: project?.status ?? "Idea",
      target_completion_date: project?.target_completion_date ?? "",
      notes: project?.notes ?? "",
      image_url: project?.image_url ?? "",
    },
  });

  function onSubmit(values: ProjectInput) {
    startTransition(async () => {
      const result = editing ? await updateProject(project!.id, values) : await createProject(values);
      if (result?.error) {
        toast({ variant: "destructive", title: "Something went wrong", description: result.error });
        return;
      }
      toast({ title: editing ? "Project updated" : "Project added" });
      setOpen(false);
      if (!editing) reset();
    });
  }

  function archive() {
    if (!project) return;
    startTransition(async () => {
      const res = await setProjectArchived(project.id, true);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't archive", description: res.error });
      else {
        toast({ title: "Project archived" });
        setOpen(false);
      }
    });
  }

  function remove() {
    if (!project) return;
    startTransition(async () => {
      const res = await deleteProject(project.id);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't delete", description: res.error });
      else setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Edit" : "New project"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>From a first idea right through to completion.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Project name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" placeholder="e.g. Re-landscape the garden" {...register("name")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <NativeSelect {...register("category")}>
                {PROJECT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Status">
              <NativeSelect {...register("status")}>
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estimated (£)" htmlFor="estimated_cost" error={errors.estimated_cost?.message}>
              <Input id="estimated_cost" type="number" step="0.01" {...register("estimated_cost")} />
            </Field>
            <Field label="Actual (£)" htmlFor="actual_cost" error={errors.actual_cost?.message}>
              <Input id="actual_cost" type="number" step="0.01" {...register("actual_cost")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <NativeSelect {...register("priority")}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Target date" htmlFor="target_completion_date">
              <Input id="target_completion_date" type="date" {...register("target_completion_date")} />
            </Field>
          </div>
          <Field label="Description" htmlFor="description">
            <Textarea id="description" rows={2} {...register("description")} />
          </Field>
          <Field label="Photo" hint="Optional cover image">
            <ImageUpload value={watch("image_url")} onChange={(url) => setValue("image_url", url ?? "")} />
            <input type="hidden" {...register("image_url")} />
          </Field>
          <DialogFooter className="sm:justify-between">
            {editing ? (
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" onClick={archive} disabled={pending} aria-label="Archive project" title="Archive">
                  <Archive className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={remove} disabled={pending} aria-label="Delete project" title="Delete" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : editing ? "Save changes" : "Add project"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
