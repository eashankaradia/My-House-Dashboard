"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { ImageUpload } from "@/components/shared/image-upload";
import { useToast } from "@/hooks/use-toast";
import { purchaseOptionSchema, type PurchaseOptionInput } from "@/lib/schemas";
import type { PurchaseOption } from "@/lib/database.types";
import { fetchLinkPreview } from "@/app/actions/link-preview";
import { addOption, updateOption } from "./actions";

type Props = {
  purchaseId: string;
  option?: PurchaseOption;
  trigger: React.ReactNode;
};

export function OptionForm({ purchaseId, option, trigger }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(option);

  const [fetching, setFetching] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<PurchaseOptionInput>({
    resolver: zodResolver(purchaseOptionSchema),
    defaultValues: {
      name: option?.name ?? "",
      store: option?.store ?? "",
      url: option?.url ?? "",
      price: option?.price ?? 0,
      image_url: option?.image_url ?? "",
      notes: option?.notes ?? "",
    },
  });

  async function autofill() {
    const url = getValues("url");
    if (!url) return;
    setFetching(true);
    const res = await fetchLinkPreview(url);
    setFetching(false);
    if (res.error) {
      toast({ variant: "destructive", title: "Couldn't auto-fill", description: res.error });
      return;
    }
    if (res.title && !getValues("name")) setValue("name", res.title.slice(0, 160));
    if (res.price) setValue("price", res.price);
    if (res.image) setValue("image_url", res.image);
    toast({ title: "Filled from link" });
  }

  function onSubmit(values: PurchaseOptionInput) {
    startTransition(async () => {
      const result = editing ? await updateOption(option!.id, values) : await addOption(purchaseId, values);
      if (result?.error) {
        toast({ variant: "destructive", title: "Something went wrong", description: result.error });
        return;
      }
      toast({ title: editing ? "Option updated" : "Option added" });
      setOpen(false);
      if (!editing) reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit option" : "Add an option"}</DialogTitle>
          <DialogDescription>
            A specific product you&apos;re comparing — e.g. a particular sofa from a particular shop.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Option name" htmlFor="o-name" required error={errors.name?.message}
            tooltip="The specific product, e.g. 'DFS Marlow 3-seater, grey'.">
            <Input id="o-name" placeholder="e.g. DFS Marlow 3-seater" {...register("name")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Store" htmlFor="o-store">
              <Input id="o-store" placeholder="e.g. DFS" {...register("store")} />
            </Field>
            <Field label="Price (£)" htmlFor="o-price" error={errors.price?.message}>
              <Input id="o-price" type="number" step="0.01" {...register("price")} />
            </Field>
          </div>
          <Field label="Link (URL)" htmlFor="o-url" tooltip="Paste the product page, then tap Auto-fill to pull the name, price and photo.">
            <div className="flex gap-2">
              <Input id="o-url" type="url" placeholder="https://…" {...register("url")} />
              <Button type="button" variant="outline" onClick={autofill} disabled={fetching} className="shrink-0">
                {fetching ? "…" : "Auto-fill"}
              </Button>
            </div>
          </Field>
          <Field label="Photo" hint="Upload a photo or it's filled from the link">
            <ImageUpload value={watch("image_url")} onChange={(url) => setValue("image_url", url ?? "")} />
            <input type="hidden" {...register("image_url")} />
          </Field>
          <Field label="Notes" htmlFor="o-notes">
            <Textarea id="o-notes" rows={2} placeholder="Colour, size, delivery time…" {...register("notes")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save changes" : "Add option"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
