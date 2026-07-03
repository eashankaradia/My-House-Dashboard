"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { MarkdownProse } from "@/components/shared/markdown-prose";
import { NoteForm } from "../documents/note-form";
import { deleteDocument } from "../documents/actions";
import { formatDate } from "@/lib/utils";
import type { Document } from "@/lib/database.types";

interface NoteDetailDialogProps {
  note: Document;
  trigger: React.ReactNode;
}

export function NoteDetailDialog({ note, trigger }: NoteDetailDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="flex-row items-start justify-between gap-2 space-y-0 px-4 pb-2 pt-5 sm:px-6">
          <DialogTitle className="flex-1 pr-2 text-lg leading-snug">{note.name}</DialogTitle>
          <div className="flex shrink-0 items-center gap-1">
            <NoteForm
              note={note}
              onSaved={() => setOpen(false)}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit note">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            />
            <ConfirmDelete
              itemLabel="note"
              action={async () => {
                await deleteDocument(note.id);
                setOpen(false);
              }}
            />
          </div>
        </DialogHeader>

        <p className="px-4 text-xs text-muted-foreground sm:px-6">
          {formatDate(note.updated_at ?? note.created_at)}
        </p>

        <div className="mt-3 flex-1 overflow-y-auto border-t px-4 py-4 sm:px-6">
          {note.notes ? (
            <MarkdownProse>{note.notes}</MarkdownProse>
          ) : (
            <p className="text-sm text-muted-foreground">No content.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
