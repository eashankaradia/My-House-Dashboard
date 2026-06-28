"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
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
import { StarRating } from "@/components/shared/star-rating";
import { useToast } from "@/hooks/use-toast";
import { purchaseOptionSchema, type PurchaseOptionInput } from "@/lib/schemas";
import { FREQUENCIES, FREQUENCY_LABELS, OPTION_SHAPES, OPTION_SHAPE_LABELS } from "@/lib/constants";
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
      rating: option?.rating ?? 0,
      frequency: (option?.frequency as PurchaseOptionInput["frequency"]) ?? "one-off",
      shape: option?.shape ?? "rectangle",
      width_cm: option?.width_cm ?? undefined,
      depth_cm: option?.depth_cm ?? undefined,
      height_cm: option?.height_cm ?? undefined,
    },
  });

  // Optional extras live behind a collapsible section; one-off price is the default.
  const [showMore, setShowMore] = React.useState(
    Boolean(option && (option.store || option.url || option.image_url || option.notes || option.rating || option.width_cm || option.depth_cm || option.height_cm || (option.frequency && option.frequency !== "one-off"))),
  );
  // Furniture size/shape is furniture-only, so it's tucked behind its own toggle.
  const [showSize, setShowSize] = React.useState(
    Boolean(option && (option.width_cm || option.depth_cm || option.height_cm || (option.shape && option.shape !== "rectangle"))),
  );

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
          <Field label="Price (£)" htmlFor="o-price" error={errors.price?.message}
            hint="Assumed a one-off cost. Use the options below for a recurring price.">
            <Input id="o-price" type="number" step="0.01" {...register("price")} />
          </Field>

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            aria-expanded={showMore}
            className="flex w-full items-center justify-between rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
          >
            More details
            <ChevronDown className={`h-4 w-4 transition-transform ${showMore ? "rotate-180" : ""}`} />
          </button>

          {showMore ? (
            <div className="space-y-4 rounded-lg border bg-muted/20 p-3">
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
              <Field label="Your rating" hint="How much you rate this option, out of 5.">
                <div className="flex h-9 items-center">
                  <StarRating value={watch("rating")} onRate={async (n) => setValue("rating", n)} />
                </div>
                <input type="hidden" {...register("rating")} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Store" htmlFor="o-store">
                  <Input id="o-store" placeholder="e.g. DFS" {...register("store")} />
                </Field>
                <Field label="Price is…" htmlFor="o-frequency"
                  tooltip="Leave as one-off for a single price; pick a frequency for recurring costs.">
                  <NativeSelect id="o-frequency" {...register("frequency")}>
                    {FREQUENCIES.map((f) => (
                      <option key={f} value={f}>{FREQUENCY_LABELS[f] ?? f}</option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
              <Field label="Notes" htmlFor="o-notes">
                <Textarea id="o-notes" rows={2} placeholder="Colour, size, delivery time…" {...register("notes")} />
              </Field>

              {/* Furniture-only: tucked behind its own toggle to keep the form light. */}
              <button
                type="button"
                onClick={() => setShowSize((v) => !v)}
                aria-expanded={showSize}
                className="flex w-full items-center justify-between rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground hover:bg-accent"
              >
                Size &amp; shape (to place in the Room Designer)
                <ChevronDown className={`h-4 w-4 transition-transform ${showSize ? "rotate-180" : ""}`} />
              </button>
              {showSize ? (
                <div className="space-y-3 rounded-lg border bg-background/60 p-3">
                  <Field label="Shape" htmlFor="o-shape">
                    <NativeSelect id="o-shape" {...register("shape")}>
                      {OPTION_SHAPES.map((s) => (
                        <option key={s} value={s}>{OPTION_SHAPE_LABELS[s] ?? s}</option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Width (cm)" htmlFor="o-width" error={errors.width_cm?.message}>
                      <Input id="o-width" type="number" step="1" min="0" placeholder="180" {...register("width_cm")} />
                    </Field>
                    <Field label="Depth (cm)" htmlFor="o-depth" error={errors.depth_cm?.message}>
                      <Input id="o-depth" type="number" step="1" min="0" placeholder="90" {...register("depth_cm")} />
                    </Field>
                    <Field label="Height (cm)" htmlFor="o-height" error={errors.height_cm?.message}>
                      <Input id="o-height" type="number" step="1" min="0" placeholder="75" {...register("height_cm")} />
                    </Field>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <input type="hidden" {...register("image_url")} />
              <input type="hidden" {...register("rating")} />
            </>
          )}
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
