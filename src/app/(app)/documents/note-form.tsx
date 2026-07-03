"use client";

import * as React from "react";
import {
  Bold,
  Code,
  Eye,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  PenLine,
  Quote,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form-field";
import { MarkdownProse } from "@/components/shared/markdown-prose";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Document } from "@/lib/database.types";
import { createNote, updateNote } from "./actions";

// ── Toolbar helpers ──────────────────────────────────────────────────────────

function wrapSelection(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  setValue: (v: string) => void,
  prefix: string,
  suffix: string,
  placeholder = "text",
) {
  const el = ref.current;
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selected = el.value.slice(start, end) || placeholder;
  const newValue = el.value.slice(0, start) + prefix + selected + suffix + el.value.slice(end);
  setValue(newValue);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
  });
}

function prefixLine(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  setValue: (v: string) => void,
  prefix: string,
  placeholder = "Text",
) {
  const el = ref.current;
  if (!el) return;
  const pos = el.selectionStart;
  const val = el.value;
  const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
  const lineEnd = val.indexOf("\n", pos);
  const end = lineEnd === -1 ? val.length : lineEnd;
  const line = val.slice(lineStart, end);
  const stripped = line.replace(/^(?:[#]+\s|>\s|-\s|\d+\.\s)/, "") || placeholder;
  const newLine = prefix + stripped;
  const newValue = val.slice(0, lineStart) + newLine + val.slice(end);
  setValue(newValue);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(lineStart + prefix.length, lineStart + newLine.length);
  });
}

// ── Toolbar button ───────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // don't blur the textarea
        onClick();
      }}
      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface NoteFormProps {
  note?: Document;
  trigger?: React.ReactNode;
  onSaved?: () => void;
}

export function NoteForm({ note, trigger, onSaved }: NoteFormProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [body, setBody] = React.useState("");
  const [tab, setTab] = React.useState<"write" | "preview">("write");
  const [pending, startTransition] = React.useTransition();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (open) {
      setName(note?.name ?? "");
      setBody(note?.notes ?? "");
      setTab("write");
    }
  }, [open, note?.id, note?.name, note?.notes]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = note
        ? await updateNote(note.id, name, body)
        : await createNote(name, body);
      if (result?.error) {
        toast({ variant: "destructive", title: "Couldn't save note", description: result.error });
        return;
      }
      toast({ title: note ? "Note updated" : "Note saved" });
      setOpen(false);
      onSaved?.();
    });
  }

  const toolbar = (
    <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
      <ToolbarBtn title="Bold" onClick={() => wrapSelection(textareaRef, setBody, "**", "**", "bold")}>
        <Bold className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn title="Italic" onClick={() => wrapSelection(textareaRef, setBody, "*", "*", "italic")}>
        <Italic className="h-3.5 w-3.5" />
      </ToolbarBtn>

      <span className="mx-1 h-4 w-px bg-border" />

      <ToolbarBtn title="Heading 2" onClick={() => prefixLine(textareaRef, setBody, "## ", "Heading")}>
        <Heading2 className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn title="Heading 3" onClick={() => prefixLine(textareaRef, setBody, "### ", "Heading")}>
        <Heading3 className="h-3.5 w-3.5" />
      </ToolbarBtn>

      <span className="mx-1 h-4 w-px bg-border" />

      <ToolbarBtn
        title="Bullet list"
        onClick={() => prefixLine(textareaRef, setBody, "- ", "List item")}
      >
        <List className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        title="Numbered list"
        onClick={() => prefixLine(textareaRef, setBody, "1. ", "List item")}
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        title="Blockquote"
        onClick={() => prefixLine(textareaRef, setBody, "> ", "Quote")}
      >
        <Quote className="h-3.5 w-3.5" />
      </ToolbarBtn>

      <span className="mx-1 h-4 w-px bg-border" />

      <ToolbarBtn
        title="Inline code"
        onClick={() => wrapSelection(textareaRef, setBody, "`", "`", "code")}
      >
        <Code className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        title="Link"
        onClick={() => wrapSelection(textareaRef, setBody, "[", "](https://)", "link text")}
      >
        <Link className="h-3.5 w-3.5" />
      </ToolbarBtn>

      <div className="ml-auto flex items-center rounded-md border p-0.5 text-xs">
        <button
          type="button"
          onClick={() => setTab("write")}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-0.5",
            tab === "write" && "bg-accent",
          )}
        >
          <PenLine className="h-3 w-3" /> Write
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-0.5",
            tab === "preview" && "bg-accent",
          )}
        >
          <Eye className="h-3 w-3" /> Preview
        </button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <StickyNote className="h-4 w-4" /> Add note
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="px-4 pb-3 pt-5 sm:px-6">
          <DialogTitle>{note ? "Edit note" : "New note"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="px-4 pb-4 sm:px-6">
            <Field label="Title" htmlFor="note-name" required>
              <Input
                id="note-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bin collection days"
                required
              />
            </Field>
          </div>

          <div className="flex flex-col overflow-hidden border-y">
            {toolbar}
            {tab === "write" ? (
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  "Write your note…\n\nTip: use **bold**, *italic*, ## headings, - bullet lists."
                }
                required
                className="min-h-[220px] resize-none bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground sm:min-h-[280px] sm:px-6"
              />
            ) : (
              <div className="min-h-[220px] overflow-y-auto px-4 py-3 sm:min-h-[280px] sm:px-6">
                {body.trim() ? (
                  <MarkdownProse>{body}</MarkdownProse>
                ) : (
                  <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="px-4 pb-4 pt-3 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : note ? "Save changes" : "Save note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
