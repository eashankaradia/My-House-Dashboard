"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { ImageUpload } from "@/components/shared/image-upload";
import { useToast } from "@/hooks/use-toast";
import { fetchLinkPreview } from "@/app/actions/link-preview";
import {
  INSPIRATION_CATEGORIES,
  INSPIRATION_SOURCES,
  INSPIRATION_STATUSES,
  PRIORITIES,
} from "@/lib/constants";
import { useRooms } from "@/hooks/use-rooms";
import { inspirationSchema, type InspirationInput } from "@/lib/schemas";
import type { Collection, Inspiration } from "@/lib/database.types";
import { FormDeleteButton } from "@/components/shared/form-delete-button";
import { createInspiration, deleteInspiration, updateInspiration } from "./actions";

type Props = {
  inspiration?: Inspiration;
  collections: Collection[];
  trigger?: React.ReactNode;
};

export function InspirationForm({ inspiration, collections, trigger }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(inspiration);
  const rooms = useRooms();

  const [fetching, setFetching] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<InspirationInput>({
    resolver: zodResolver(inspirationSchema),
    defaultValues: {
      title: inspiration?.title ?? "",
      link: inspiration?.link ?? "",
      source: inspiration?.source ?? "Instagram",
      category: inspiration?.category ?? "",
      room: inspiration?.room ?? "",
      tags: inspiration?.tags?.join(", ") ?? "",
      notes: inspiration?.notes ?? "",
      priority: inspiration?.priority ?? "Low",
      status: inspiration?.status ?? "Saved",
      image_url: inspiration?.image_url ?? "",
      collection_id: inspiration?.collection_id ?? "",
    },
  });

  async function autofill() {
    const link = getValues("link");
    if (!link) return;
    setFetching(true);
    const res = await fetchLinkPreview(link);
    setFetching(false);
    if (res.error) {
      toast({ variant: "destructive", title: "Couldn't auto-fill", description: res.error });
      return;
    }
    if (res.title && !getValues("title")) setValue("title", res.title.slice(0, 160));
    if (res.image) setValue("image_url", res.image);
    toast({ title: "Filled from link" });
  }

  function onSubmit(values: InspirationInput) {
    startTransition(async () => {
      const result = editing
        ? await updateInspiration(inspiration!.id, values)
        : await createInspiration(values);
      if (result?.error) {
        toast({ variant: "destructive", title: "Something went wrong", description: result.error });
        return;
      }
      toast({ title: editing ? "Inspiration updated" : "Inspiration saved" });
      setOpen(false);
      if (!editing) reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Edit" : "Save idea"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit idea" : "Save an idea"}</DialogTitle>
          <DialogDescription>Paste a link from Instagram, TikTok, Pinterest and more.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Title" htmlFor="title" required error={errors.title?.message}>
            <Input id="title" placeholder="e.g. Dark green kitchen units" {...register("title")} />
          </Field>
          <Field label="Link (URL)" htmlFor="link" tooltip="Paste a link, then tap Auto-fill to pull the title and image.">
            <div className="flex gap-2">
              <Input id="link" type="url" placeholder="https://…" {...register("link")} />
              <Button type="button" variant="outline" onClick={autofill} disabled={fetching} className="shrink-0">
                {fetching ? "…" : "Auto-fill"}
              </Button>
            </div>
          </Field>
          <Field label="Photo" hint="Upload or auto-filled from the link">
            <ImageUpload value={watch("image_url")} onChange={(url) => setValue("image_url", url ?? "")} />
            <input type="hidden" {...register("image_url")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source">
              <NativeSelect {...register("source")}>
                {INSPIRATION_SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Category">
              <NativeSelect {...register("category")}>
                <option value="">—</option>
                {INSPIRATION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Room">
              <NativeSelect {...register("room")}>
                <option value="">—</option>
                {rooms.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Collection">
              <NativeSelect {...register("collection_id")}>
                <option value="">— None —</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <NativeSelect {...register("priority")}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Status">
              <NativeSelect {...register("status")}>
                {INSPIRATION_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <Field label="Tags" htmlFor="tags" hint="Comma-separated, e.g. modern, oak, shelving">
            <Input id="tags" placeholder="modern, oak, shelving" {...register("tags")} />
          </Field>
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" rows={2} {...register("notes")} />
          </Field>
          <DialogFooter className="sm:justify-between">
            {editing && inspiration ? (
              <FormDeleteButton
                label="Delete idea"
                onDelete={async () => {
                  const res = await deleteInspiration(inspiration.id);
                  if (!res?.error) setOpen(false);
                  return res;
                }}
              />
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : editing ? "Save changes" : "Save idea"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
