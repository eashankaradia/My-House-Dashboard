"use client";

import * as React from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { FormDeleteButton } from "@/components/shared/form-delete-button";
import { ImageUpload } from "@/components/shared/image-upload";
import { useToast } from "@/hooks/use-toast";
import { HEALTH_INSPIRATION_KINDS, HEALTH_INSPIRATION_KIND_LABELS } from "@/lib/constants";
import type { HealthInspiration } from "@/lib/database.types";
import { createHealthInspiration, updateHealthInspiration, deleteHealthInspiration } from "./actions";

type Props = { item?: HealthInspiration; trigger?: React.ReactNode };

export function HealthInspirationForm({ item, trigger }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(item);

  const [kind, setKind] = React.useState(item?.kind ?? "reel");
  const [title, setTitle] = React.useState(item?.title ?? "");
  const [url, setUrl] = React.useState(item?.url ?? "");
  const [imageUrl, setImageUrl] = React.useState<string | null>(item?.image_url ?? null);
  const [source, setSource] = React.useState(item?.source ?? "");
  const [content, setContent] = React.useState(item?.content ?? "");

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v && item) {
      setKind(item.kind);
      setTitle(item.title);
      setUrl(item.url ?? "");
      setImageUrl(item.image_url ?? null);
      setSource(item.source ?? "");
      setContent(item.content ?? "");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      const payload = {
        kind,
        title: title.trim(),
        url: url.trim() || undefined,
        image_url: imageUrl ?? undefined,
        source: source.trim() || undefined,
        content: content.trim() || undefined,
      };
      const result = editing ? await updateHealthInspiration(item!.id, payload) : await createHealthInspiration(payload);
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: editing ? "Updated" : "Saved" });
      setOpen(false);
      if (!editing) {
        setKind("reel");
        setTitle("");
        setUrl("");
        setImageUrl(null);
        setSource("");
        setContent("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5">
            {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Edit" : "Add inspiration"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit" : "Save health inspiration"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Type">
            <NativeSelect value={kind} onChange={(e) => setKind(e.target.value)}>
              {HEALTH_INSPIRATION_KINDS.map((k) => (
                <option key={k} value={k}>
                  {HEALTH_INSPIRATION_KIND_LABELS[k]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Title" required>
            <Input placeholder="e.g. 10-minute morning mobility routine" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </Field>
          {kind === "reel" ? (
            <Field label="Video link" hint="A YouTube/TikTok/Instagram link">
              <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
            </Field>
          ) : (
            <Field label="Link (optional)">
              <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
            </Field>
          )}
          <Field label="Cover photo">
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </Field>
          <Field label="Source">
            <Input placeholder="e.g. Instagram, a friend, a book" value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
          <Field label={kind === "guide" ? "Guide content" : "Notes"}>
            <Textarea
              placeholder={kind === "guide" ? "Write the guide / key takeaways..." : "What's useful about this..."}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </Field>
          <DialogFooter className={editing ? "sm:justify-between" : undefined}>
            {editing && (
              <FormDeleteButton
                label="Delete"
                onDelete={async () => {
                  const r = await deleteHealthInspiration(item!.id);
                  if (!r?.error) {
                    toast({ title: "Deleted" });
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
              <Button type="submit" disabled={pending}>
                {editing ? "Save changes" : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
