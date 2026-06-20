"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FolderPlus } from "lucide-react";
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
import { collectionSchema, type CollectionInput } from "@/lib/schemas";
import { createCollection } from "./actions";

export function CollectionForm() {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CollectionInput>({
    resolver: zodResolver(collectionSchema),
    defaultValues: { name: "", description: "" },
  });

  function onSubmit(values: CollectionInput) {
    startTransition(async () => {
      const result = await createCollection(values);
      if (result?.error) {
        toast({ variant: "destructive", title: "Something went wrong", description: result.error });
        return;
      }
      toast({ title: "Collection created" });
      setOpen(false);
      reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FolderPlus className="h-4 w-4" /> New collection
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>Group ideas like Dream Kitchen or Garden Ideas.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" placeholder="e.g. Dream Kitchen" {...register("name")} />
          </Field>
          <Field label="Description" htmlFor="description">
            <Textarea id="description" rows={2} {...register("description")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
