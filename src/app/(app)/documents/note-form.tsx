"use client";

import * as React from "react";
import { StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { createDocument } from "./actions";

/** A lightweight note — stored as a Document of category "Note" with no file. */
export function NoteForm({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("category", "Note");
    startTransition(async () => {
      const result = await createDocument(formData);
      if (result?.error) {
        toast({ variant: "destructive", title: "Couldn't save note", description: result.error });
        return;
      }
      toast({ title: "Note saved" });
      setOpen(false);
      formRef.current?.reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <StickyNote className="h-4 w-4" /> Add note
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a note</DialogTitle>
          <DialogDescription>A quick note for the household — no file needed.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          <Field label="Title" htmlFor="note-name" required>
            <Input id="note-name" name="name" placeholder="e.g. Bin collection days" required />
          </Field>
          <Field label="Note" htmlFor="note-body" required>
            <Textarea id="note-body" name="notes" rows={5} placeholder="Write your note…" required />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
