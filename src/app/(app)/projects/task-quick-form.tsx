"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { createTask } from "./actions";

type ProjectOption = { id: string; name: string };

export function TaskQuickForm({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [due, setDue] = React.useState("");
  const [projects, setProjects] = React.useState<ProjectOption[]>([]);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  // Load project options when the dialog opens (so a task can be linked).
  React.useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    supabase
      .from("projects")
      .select("id, name")
      .order("name")
      .then(({ data }) => setProjects((data ?? []) as ProjectOption[]));
  }, [open]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      const res = await createTask({
        title,
        project_id: projectId || null,
        due_date: due || null,
        scope: process.env.NEXT_PUBLIC_APP === "life" ? "personal" : "household",
      });
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't add task", description: res.error });
        return;
      }
      toast({ title: "Task added" });
      setTitle("");
      setDue("");
      setProjectId("");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a task</DialogTitle>
          <DialogDescription>A quick to-do — standalone or tied to a project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Task" htmlFor="t-title" required>
            <Input id="t-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Call the plumber" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Project" tooltip="Optional — links the task to a project and shows it as a sub-task there.">
              <NativeSelect value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Due date" htmlFor="t-due">
              <Input id="t-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !title.trim()}>
              {pending ? "Adding…" : "Add task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
