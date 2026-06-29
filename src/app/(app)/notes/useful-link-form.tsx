"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2 } from "lucide-react";
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
import { usefulLinkSchema, type UsefulLinkInput } from "@/lib/schemas";
import type { UsefulLink } from "@/lib/database.types";
import { createUsefulLink, updateUsefulLink } from "./actions";

export function UsefulLinkForm({ link, trigger }: { link?: UsefulLink; trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(link);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UsefulLinkInput>({
    resolver: zodResolver(usefulLinkSchema),
    defaultValues: {
      title: link?.title ?? "",
      url: link?.url ?? "",
      description: link?.description ?? "",
    },
  });

  function onSubmit(values: UsefulLinkInput) {
    startTransition(async () => {
      const result = editing ? await updateUsefulLink(link!.id, values) : await createUsefulLink(values);
      if (result?.error) {
        toast({ variant: "destructive", title: "Couldn't save link", description: result.error });
        return;
      }
      toast({ title: editing ? "Link updated" : "Link saved" });
      setOpen(false);
      if (!editing) reset({ title: "", url: "", description: "" });
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <Link2 className="h-4 w-4" /> Add link
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit link" : "Add a useful link"}</DialogTitle>
          <DialogDescription>A handy web page the household refers to — a portal, a council page, a how-to.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Title" htmlFor="link-title" required error={errors.title?.message}>
            <Input id="link-title" placeholder="e.g. Council bin calendar" {...register("title")} />
          </Field>
          <Field label="URL" htmlFor="link-url" required error={errors.url?.message}>
            <Input id="link-url" type="url" placeholder="https://…" {...register("url")} />
          </Field>
          <Field label="Note (optional)" htmlFor="link-desc" error={errors.description?.message}>
            <Textarea id="link-desc" rows={2} placeholder="What it's for…" {...register("description")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save changes" : "Save link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
