"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form-field";
import { AddToCalendar } from "@/components/shared/add-to-calendar";
import { AddedBy } from "@/components/shared/added-by";
import { useToast } from "@/hooks/use-toast";
import { cn, daysUntil, formatDate } from "@/lib/utils";
import type { MemberMap } from "@/lib/household";
import type { ProjectTask } from "@/lib/database.types";
import { createTask, deleteTask, toggleTask, updateTask } from "@/app/(app)/projects/actions";

type ProjectOption = { id: string; name: string };

export function TasksView({
  tasks,
  projects,
  memberMap,
}: {
  tasks: ProjectTask[];
  projects: ProjectOption[];
  memberMap: MemberMap;
}) {
  const projectName = React.useMemo(() => {
    const m = new Map(projects.map((p) => [p.id, p.name]));
    return (id: string | null) => (id ? m.get(id) ?? null : null);
  }, [projects]);

  const outstanding = tasks.filter((t) => !t.is_done);
  const done = tasks.filter((t) => t.is_done);

  return (
    <div className="space-y-6">
      <AddTaskForm projects={projects} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">To do ({outstanding.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {outstanding.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nothing outstanding 🎉</p>
          ) : (
            outstanding.map((task) => (
              <TaskRow key={task.id} task={task} projects={projects} project={projectName(task.project_id)} memberMap={memberMap} />
            ))
          )}
        </CardContent>
      </Card>

      {done.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Done ({done.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {done.map((task) => (
              <TaskRow key={task.id} task={task} projects={projects} project={projectName(task.project_id)} memberMap={memberMap} />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function AddTaskForm({ projects }: { projects: ProjectOption[] }) {
  const [title, setTitle] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [due, setDue] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      const res = await createTask({ title, project_id: projectId || null, due_date: due || null });
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't add task", description: res.error });
        return;
      }
      setTitle("");
      setDue("");
      toast({ title: "Task added" });
    });
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task…"
            className="flex-1"
          />
          <NativeSelect value={projectId} onChange={(e) => setProjectId(e.target.value)} className="sm:w-44">
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </NativeSelect>
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="sm:w-40" />
          <Button type="submit" disabled={pending} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TaskRow({
  task,
  projects,
  project,
  memberMap,
}: {
  task: ProjectTask;
  projects: ProjectOption[];
  project: string | null;
  memberMap: MemberMap;
}) {
  const [pending, startTransition] = React.useTransition();
  const days = daysUntil(task.due_date);

  return (
    <div className="flex items-center gap-3 rounded-lg border p-2.5">
      <Checkbox
        checked={task.is_done}
        onCheckedChange={() => startTransition(async () => void (await toggleTask(task.id, !task.is_done)))}
      />
      <div className="min-w-0 flex-1">
        <TaskEditDialog task={task} projects={projects}>
          <button
            className={cn(
              "block w-full truncate text-left text-sm hover:underline",
              task.is_done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </button>
        </TaskEditDialog>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {project ? <Badge variant="secondary">{project}</Badge> : null}
          {task.due_date ? <span>Due {formatDate(task.due_date)}</span> : null}
          <AddedBy name={memberMap[task.user_id]} />
        </div>
      </div>
      {task.due_date && !task.is_done ? (
        days !== null && days < 0 ? (
          <Badge variant="destructive">{Math.abs(days)}d late</Badge>
        ) : days !== null && days <= 7 ? (
          <Badge variant="warning">{days}d</Badge>
        ) : null
      ) : null}
      {task.due_date ? <AddToCalendar title={task.title} date={task.due_date} description={project ?? ""} /> : null}
      <button
        onClick={() => startTransition(async () => void (await deleteTask(task.id)))}
        disabled={pending}
        className="text-muted-foreground hover:text-destructive"
        aria-label="Delete task"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function TaskEditDialog({
  task,
  projects,
  children,
}: {
  task: ProjectTask;
  projects: ProjectOption[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState(task.title);
  const [projectId, setProjectId] = React.useState(task.project_id ?? "");
  const [due, setDue] = React.useState(task.due_date ?? "");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  // Reset fields to the latest task values whenever the dialog is opened.
  React.useEffect(() => {
    if (open) {
      setTitle(task.title);
      setProjectId(task.project_id ?? "");
      setDue(task.due_date ?? "");
    }
  }, [open, task.title, task.project_id, task.due_date]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      const res = await updateTask(task.id, {
        title,
        project_id: projectId || null,
        due_date: due || null,
      });
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't save task", description: res.error });
        return;
      }
      toast({ title: "Task updated" });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Task" htmlFor="te-title" required>
            <Input id="te-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Project">
              <NativeSelect value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Due date" htmlFor="te-due">
              <Input id="te-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !title.trim()}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
