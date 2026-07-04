"use client";

import * as React from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form-field";
import { FormDeleteButton } from "@/components/shared/form-delete-button";
import { useToast } from "@/hooks/use-toast";
import type { PrivateNote } from "@/lib/database.types";
import { createPrivateNote, updatePrivateNote, deletePrivateNote } from "./actions";

export function PrivateNoteForm({ note, trigger }: { note?: PrivateNote; trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(note);

  const [title, setTitle] = React.useState(note?.title ?? "");
  const [content, setContent] = React.useState(note?.content ?? "");

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v && note) {
      setTitle(note.title);
      setContent(note.content ?? "");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      const result = editing
        ? await updatePrivateNote(note!.id, { title, content })
        : await createPrivateNote({ title, content });
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: editing ? "Note updated" : "Note saved" });
      setOpen(false);
      if (!editing) {
        setTitle("");
        setContent("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5">
            {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? null : "New note"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit private note" : "New private note"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Title" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Passport renewal notes" required autoFocus />
          </Field>
          <Field label="Content">
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="Only you can see this." />
          </Field>
          <DialogFooter className={editing ? "sm:justify-between" : undefined}>
            {editing && note && (
              <FormDeleteButton
                label="Delete note"
                onDelete={async () => {
                  const r = await deletePrivateNote(note.id);
                  if (!r?.error) {
                    toast({ title: "Note deleted" });
                    setOpen(false);
                  }
                  return r;
                }}
              />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending || !title.trim()}>
                {editing ? "Save changes" : "Save note"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
