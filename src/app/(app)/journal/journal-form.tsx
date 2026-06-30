"use client";

import * as React from "react";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { FormDeleteButton } from "@/components/shared/form-delete-button";
import { useToast } from "@/hooks/use-toast";
import { MOOD_OPTIONS } from "@/lib/constants";
import type { JournalEntry } from "@/lib/database.types";
import { upsertJournalEntry, deleteJournalEntry } from "./actions";

type Props = {
  entry?: JournalEntry;
  date?: string;
  trigger?: React.ReactNode;
};

export function JournalForm({ entry, date, trigger }: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(entry);

  const [entryDate, setEntryDate] = React.useState(entry?.entry_date ?? date ?? todayStr);
  const [mood, setMood] = React.useState(entry?.mood ?? "");
  const [content, setContent] = React.useState(entry?.content ?? "");
  const [gratitude, setGratitude] = React.useState(entry?.gratitude ?? "");

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v) {
      setEntryDate(entry?.entry_date ?? date ?? todayStr);
      setMood(entry?.mood ?? "");
      setContent(entry?.content ?? "");
      setGratitude(entry?.gratitude ?? "");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !gratitude.trim()) return;
    startTransition(async () => {
      const selectedMood = MOOD_OPTIONS.find((m) => m.value === mood);
      const result = await upsertJournalEntry({
        entry_date: entryDate,
        mood: mood || undefined,
        mood_score: selectedMood?.score,
        content: content.trim() || undefined,
        gratitude: gratitude.trim() || undefined,
      });
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: editing ? "Entry updated" : "Entry saved" });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5">
            <PenLine className="h-4 w-4" />
            {editing ? "Edit entry" : "Write today"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing
              ? "Edit entry"
              : entryDate === todayStr
              ? "Today's journal"
              : new Date(entryDate + "T00:00:00").toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {!editing && (
            <Field label="Date">
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </Field>
          )}
          <Field label="How are you feeling?">
            <div className="flex gap-2">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  title={m.label}
                  onClick={() => setMood(mood === m.value ? "" : m.value)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xl transition-colors ${
                    mood === m.value ? "border-primary bg-primary/10" : "hover:bg-accent"
                  }`}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Reflection" hint="What happened today? What are you thinking about?">
            <Textarea
              placeholder="Today I..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              autoFocus
            />
          </Field>
          <Field label="Grateful for" hint="One thing you appreciate today">
            <Textarea
              placeholder="I'm grateful for..."
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              rows={2}
            />
          </Field>
          <DialogFooter className={editing ? "sm:justify-between" : undefined}>
            {editing && entry && (
              <FormDeleteButton
                label="Delete entry"
                onDelete={async () => {
                  const r = await deleteJournalEntry(entry.id);
                  if (!r?.error) { toast({ title: "Entry deleted" }); setOpen(false); }
                  return r;
                }}
              />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {editing ? "Save changes" : "Save entry"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
