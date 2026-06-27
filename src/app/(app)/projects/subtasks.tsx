"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ProjectTask, ProjectWithTasks } from "@/lib/database.types";
import { TaskEditDialog } from "../tasks/tasks-view";
import { addTask, deleteTask, toggleTask } from "./actions";

export function Subtasks({ project }: { project: ProjectWithTasks }) {
  const [title, setTitle] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function add(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setTitle("");
    startTransition(async () => {
      const res = await addTask(project.id, t);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't add task", description: res.error });
    });
  }

  function toggle(task: ProjectTask) {
    startTransition(async () => {
      await toggleTask(task.id, !task.is_done);
    });
  }

  // Show active sub-tasks here; cleared (archived) ones still count toward the
  // project's progress but are summarised rather than listed.
  const active = project.tasks.filter((t) => !t.archived_at);
  const clearedCount = project.tasks.length - active.length;

  return (
    <div className="space-y-1.5 rounded-lg bg-muted/30 p-2">
      {active.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">No sub-tasks yet</p>
      ) : (
        active.map((task) => (
          <div key={task.id} className="flex items-center gap-2">
            <Checkbox checked={task.is_done} onCheckedChange={() => toggle(task)} className="h-4 w-4" />
            <TaskEditDialog task={task}>
              <button
                type="button"
                className={cn("flex-1 truncate text-left text-sm hover:underline", task.is_done && "text-muted-foreground line-through")}
              >
                {task.title}
              </button>
            </TaskEditDialog>
            <button
              onClick={() => startTransition(async () => void (await deleteTask(task.id)))}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Delete task"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))
      )}
      {clearedCount > 0 ? (
        <p className="px-1 text-xs text-muted-foreground">{clearedCount} cleared (kept for progress)</p>
      ) : null}
      <form onSubmit={add} className="flex items-center gap-2 pt-1">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a sub-task…"
          className="h-8 text-sm"
        />
        <Button type="submit" size="icon" variant="outline" className="h-8 w-8 shrink-0" disabled={pending}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
