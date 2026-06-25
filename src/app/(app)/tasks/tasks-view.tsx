"use client";

import * as React from "react";
import { Archive, Plus, Trash2, X } from "lucide-react";
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
import { CardTrigger } from "@/components/shared/card-trigger";
import { useToast } from "@/hooks/use-toast";
import { useOpenFromUrl } from "@/hooks/use-open-from-url";
import { LinkedItems } from "@/app/(app)/links/linked-items";
import { cn, daysUntil, formatDate } from "@/lib/utils";
import type { MemberMap } from "@/lib/household";
import type { ProjectTask } from "@/lib/database.types";
import { createTask, deleteTask, setTaskArchived, toggleTask, updateTask } from "@/app/(app)/projects/actions";

type ProjectOption = { id: string; name: string };
type Member = { id: string; name: string };

export function TasksView({
  tasks,
  projects,
  memberMap,
  currentUserId,
}: {
  tasks: ProjectTask[];
  projects: ProjectOption[];
  memberMap: MemberMap;
  currentUserId: string;
}) {
  const [onlyMine, setOnlyMine] = React.useState(false);

  const members: Member[] = React.useMemo(
    () => Object.entries(memberMap).map(([id, name]) => ({ id, name })),
    [memberMap],
  );

  const projectName = React.useMemo(() => {
    const m = new Map(projects.map((p) => [p.id, p.name]));
    return (id: string | null) => (id ? m.get(id) ?? null : null);
  }, [projects]);

  // "Mine" = assigned to me, or created by me and not assigned to someone else.
  const isMine = React.useCallback(
    (t: ProjectTask) => t.assigned_to === currentUserId || (!t.assigned_to && t.user_id === currentUserId),
    [currentUserId],
  );

  const visible = onlyMine ? tasks.filter(isMine) : tasks;
  const outstanding = visible.filter((t) => !t.is_done);
  const done = visible.filter((t) => t.is_done);

  return (
    <div className="space-y-6">
      <AddTaskForm projects={projects} members={members} />

      {members.length > 1 ? (
        <div className="flex items-center justify-end">
          <div className="flex items-center rounded-lg border p-0.5 text-xs">
            <button onClick={() => setOnlyMine(false)} className={cn("rounded-md px-2.5 py-1", !onlyMine && "bg-accent")}>
              All tasks
            </button>
            <button onClick={() => setOnlyMine(true)} className={cn("rounded-md px-2.5 py-1", onlyMine && "bg-accent")}>
              Mine
            </button>
          </div>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">To do ({outstanding.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {outstanding.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nothing outstanding 🎉</p>
          ) : (
            outstanding.map((task) => (
              <TaskRow key={task.id} task={task} projects={projects} members={members} project={projectName(task.project_id)} memberMap={memberMap} />
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
              <TaskRow key={task.id} task={task} projects={projects} members={members} project={projectName(task.project_id)} memberMap={memberMap} />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function AddTaskForm({ projects, members }: { projects: ProjectOption[]; members: Member[] }) {
  const [title, setTitle] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [assignee, setAssignee] = React.useState("");
  const [due, setDue] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      const res = await createTask({
        title,
        project_id: projectId || null,
        due_date: due || null,
        assigned_to: assignee || null,
      });
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't add task", description: res.error });
        return;
      }
      setTitle("");
      setDue("");
      setAssignee("");
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
          <NativeSelect value={projectId} onChange={(e) => setProjectId(e.target.value)} className="sm:w-40">
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </NativeSelect>
          {members.length > 1 ? (
            <NativeSelect value={assignee} onChange={(e) => setAssignee(e.target.value)} className="sm:w-36">
              <option value="">Anyone</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </NativeSelect>
          ) : null}
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
  members,
  project,
  memberMap,
}: {
  task: ProjectTask;
  projects: ProjectOption[];
  members: Member[];
  project: string | null;
  memberMap: MemberMap;
}) {
  const [pending, startTransition] = React.useTransition();
  const days = daysUntil(task.due_date);
  const assignee = task.assigned_to ? memberMap[task.assigned_to] : null;

  return (
    <div className="flex items-center gap-3 rounded-lg border p-2.5">
      <Checkbox
        checked={task.is_done}
        onCheckedChange={() => startTransition(async () => void (await toggleTask(task.id, !task.is_done)))}
      />
      <TaskEditDialog task={task} projects={projects} members={members}>
        <CardTrigger className="min-w-0 flex-1 rounded-md hover:underline">
          <span className={cn("block truncate text-sm", task.is_done && "text-muted-foreground line-through")}>
            {task.title}
          </span>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {project ? <Badge variant="secondary">{project}</Badge> : null}
            {assignee ? <Badge variant="outline">{assignee}</Badge> : null}
            {task.due_date ? <span>Due {formatDate(task.due_date)}</span> : null}
            <AddedBy name={memberMap[task.user_id]} />
          </div>
        </CardTrigger>
      </TaskEditDialog>
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
  members,
  children,
}: {
  task: ProjectTask;
  projects: ProjectOption[];
  members: Member[];
  children: React.ReactNode;
}) {
  const { open, onOpenChange } = useOpenFromUrl(task.id, "task");
  const [title, setTitle] = React.useState(task.title);
  const [projectId, setProjectId] = React.useState(task.project_id ?? "");
  const [assignee, setAssignee] = React.useState(task.assigned_to ?? "");
  const [due, setDue] = React.useState(task.due_date ?? "");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  // Reset fields to the latest task values whenever the dialog is opened.
  React.useEffect(() => {
    if (open) {
      setTitle(task.title);
      setProjectId(task.project_id ?? "");
      setAssignee(task.assigned_to ?? "");
      setDue(task.due_date ?? "");
    }
  }, [open, task.title, task.project_id, task.assigned_to, task.due_date]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      const res = await updateTask(task.id, {
        title,
        project_id: projectId || null,
        due_date: due || null,
        assigned_to: assignee || null,
      });
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't save task", description: res.error });
        return;
      }
      toast({ title: "Task updated" });
      onOpenChange(false);
    });
  }

  function archive() {
    startTransition(async () => {
      const res = await setTaskArchived(task.id, true);
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't archive", description: res.error });
        return;
      }
      toast({ title: "Task archived" });
      onOpenChange(false);
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteTask(task.id);
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't delete", description: res.error });
        return;
      }
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          {members.length > 1 ? (
            <Field label="Assigned to">
              <NativeSelect value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                <option value="">Anyone</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </NativeSelect>
            </Field>
          ) : null}
          <div className="border-t pt-3">
            <LinkedItems type="task" id={task.id} />
          </div>
          <DialogFooter className="flex-row items-center justify-between sm:justify-between">
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" onClick={archive} disabled={pending} aria-label="Archive task" title="Archive">
                <Archive className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={remove} disabled={pending} aria-label="Delete task" title="Delete" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Button type="submit" disabled={pending || !title.trim()}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
