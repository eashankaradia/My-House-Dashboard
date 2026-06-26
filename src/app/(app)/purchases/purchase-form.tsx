"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, Pencil, Plus, Trash2 } from "lucide-react";
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
import { StarRating } from "@/components/shared/star-rating";
import { ImageUpload } from "@/components/shared/image-upload";
import { useToast } from "@/hooks/use-toast";
import {
  PRIORITIES,
  PURCHASE_CATEGORIES,
  PURCHASE_STATUSES,
  ROOMS,
} from "@/lib/constants";
import { purchaseSchema, type PurchaseInput } from "@/lib/schemas";
import type { Purchase } from "@/lib/database.types";
import { createPurchase, deletePurchase, setPurchaseArchived, updatePurchase } from "./actions";

type Props = {
  purchase?: Purchase;
  trigger?: React.ReactNode;
  defaults?: Partial<PurchaseInput>;
  /** Household members, so a buyer can be chosen when marking Purchased. */
  members?: { id: string; name: string }[];
};

export function PurchaseForm({ purchase, trigger, defaults, members = [] }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(purchase);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PurchaseInput>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      name: purchase?.name ?? defaults?.name ?? "",
      url: purchase?.url ?? defaults?.url ?? "",
      store: purchase?.store ?? "",
      price: purchase?.price ?? 0,
      category: purchase?.category ?? defaults?.category ?? "Furniture",
      room: purchase?.room ?? defaults?.room ?? "",
      priority: purchase?.priority ?? defaults?.priority ?? "Low",
      status: purchase?.status ?? "Considering",
      non_negotiables: purchase?.non_negotiables ?? "",
      notes: purchase?.notes ?? "",
      rating: purchase?.rating ?? 0,
      purchased_by: purchase?.purchased_by ?? "",
      purchased_price: purchase?.purchased_price ?? undefined,
      receipt_url: purchase?.receipt_url ?? "",
    },
  });

  const currentStatus = watch("status");

  // "found" = a specific product (capture its price/link here); "compare" = a
  // type of thing you'll add options to compare later.
  const [mode, setMode] = React.useState<"found" | "compare">(
    editing && Number(purchase?.price) === 0 ? "compare" : "found",
  );

  function onSubmit(values: PurchaseInput) {
    const payload =
      mode === "compare" ? { ...values, price: 0, url: "", store: "" } : values;
    startTransition(async () => {
      const result = editing ? await updatePurchase(purchase!.id, payload) : await createPurchase(payload);
      if (result?.error) {
        toast({ variant: "destructive", title: "Something went wrong", description: result.error });
        return;
      }
      toast({ title: editing ? "Purchase updated" : "Added to wishlist" });
      setOpen(false);
      if (!editing) reset();
    });
  }

  function archive() {
    if (!purchase) return;
    startTransition(async () => {
      const res = await setPurchaseArchived(purchase.id, true);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't archive", description: res.error });
      else {
        toast({ title: "Item archived" });
        setOpen(false);
      }
    });
  }

  function remove() {
    if (!purchase) return;
    startTransition(async () => {
      const res = await deletePurchase(purchase.id);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't delete", description: res.error });
      else setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Edit" : "Add item"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit item" : "Add to wishlist"}</DialogTitle>
          <DialogDescription>Something you&apos;d love for the home — now or later.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Mode selector */}
          <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setMode("found")}
              className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                mode === "found" ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              A specific item I&apos;ve found
            </button>
            <button
              type="button"
              onClick={() => setMode("compare")}
              className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                mode === "compare" ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              A thing to compare options for
            </button>
          </div>

          <Field
            label={mode === "compare" ? "What do you want?" : "Item name"}
            htmlFor="name"
            required
            error={errors.name?.message}
            tooltip={
              mode === "compare"
                ? "The thing you want (e.g. 'New sofa'). You'll add options to compare after saving."
                : "The specific product you've found."
            }
          >
            <Input
              id="name"
              placeholder={mode === "compare" ? "e.g. New sofa" : "e.g. DFS Corner sofa"}
              {...register("name")}
            />
          </Field>

          {mode === "found" ? (
            <>
              <Field label="Link (URL)" htmlFor="url">
                <Input id="url" type="url" placeholder="https://…" {...register("url")} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Store" htmlFor="store">
                  <Input id="store" placeholder="e.g. IKEA" {...register("store")} />
                </Field>
                <Field label="Price (£)" htmlFor="price" error={errors.price?.message}>
                  <Input id="price" type="number" step="0.01" {...register("price")} />
                </Field>
              </div>
            </>
          ) : (
            <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              After saving, use <span className="font-medium text-foreground">Add option</span> on the
              card to add products to compare — each with its own price, link and photo.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" tooltip="The broad type of item.">
              <NativeSelect {...register("category")}>
                {PURCHASE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Your rating" tooltip="How much you rate this item, out of 5. You can also rate it later from the list.">
              <div className="flex h-9 items-center">
                <StarRating value={watch("rating")} onRate={async (n) => setValue("rating", n)} />
              </div>
              <input type="hidden" {...register("rating")} />
            </Field>
          </div>
          <Field
            label="Non-negotiable features and qualities"
            htmlFor="non-negotiables"
            hint="The must-haves an option needs before you'd buy it."
          >
            <Textarea
              id="non-negotiables"
              rows={3}
              placeholder="e.g. Solid wood, washable covers, no wider than 210cm"
              {...register("non_negotiables")}
            />
          </Field>
          <Field label="Room" tooltip="Which room this is for. Helps you sort and plan room by room.">
            <NativeSelect {...register("room")}>
              <option value="">—</option>
              {ROOMS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </NativeSelect>
          </Field>
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
                {PURCHASE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          {currentStatus === "Purchased" ? (
            <div className="space-y-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Purchase details (all optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Who bought it?" htmlFor="purchased_by">
                  <NativeSelect id="purchased_by" {...register("purchased_by")}>
                    <option value="">—</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Paid (£)" htmlFor="purchased_price">
                  <Input id="purchased_price" type="number" step="0.01" placeholder="0.00" {...register("purchased_price")} />
                </Field>
              </div>
              <Field label="Receipt photo" hint="Upload a picture of the receipt">
                <ImageUpload value={watch("receipt_url")} onChange={(url) => setValue("receipt_url", url ?? "")} />
                <input type="hidden" {...register("receipt_url")} />
              </Field>
            </div>
          ) : null}

          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" rows={2} {...register("notes")} />
          </Field>
          <DialogFooter className="sm:justify-between">
            {editing ? (
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" onClick={archive} disabled={pending} aria-label="Archive item" title="Archive">
                  <Archive className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={remove} disabled={pending} aria-label="Delete item" title="Delete" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : editing ? "Save changes" : "Add item"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
