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
import { ImageUpload } from "@/components/shared/image-upload";
import { useToast } from "@/hooks/use-toast";
import {
  PRIORITIES,
  PURCHASE_SIZES,
  PURCHASE_STATUSES,
} from "@/lib/constants";
import { useRooms } from "@/hooks/use-rooms";
import { purchaseSchema, type PurchaseInput, type PurchaseOptionInput } from "@/lib/schemas";
import type { Purchase } from "@/lib/database.types";
import { createPurchaseWithOptions, deletePurchase, setPurchaseArchived, updatePurchase } from "./actions";

type DraftOption = { name: string; price: string; store: string; url: string };

type Props = {
  purchase?: Purchase;
  trigger?: React.ReactNode;
  defaults?: Partial<PurchaseInput>;
  /** Household members, so a buyer can be chosen when marking Purchased. */
  members?: { id: string; name: string }[];
  categories?: string[];
};

export function PurchaseForm({ purchase, trigger, defaults, members = [], categories = [] }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(purchase);
  const rooms = useRooms();

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
      size: (purchase?.size as PurchaseInput["size"]) ?? undefined,
      room: purchase?.room ?? defaults?.room ?? "",
      priority: purchase?.priority ?? defaults?.priority ?? "Low",
      status: purchase?.status ?? "Considering",
      non_negotiables: purchase?.non_negotiables ?? "",
      notes: purchase?.notes ?? "",
      purchased_by: purchase?.purchased_by ?? "",
      purchased_price: purchase?.purchased_price ?? undefined,
      receipt_url: purchase?.receipt_url ?? "",
    },
  });

  const currentStatus = watch("status");
  const categoryOptions = React.useMemo(
    () => Array.from(new Set(["Furniture", ...categories, purchase?.category, defaults?.category].filter(Boolean) as string[])).sort(),
    [categories, defaults?.category, purchase?.category],
  );

  // New items can have their comparison options entered up front.
  const [options, setOptions] = React.useState<DraftOption[]>([]);
  function addOptionRow() {
    setOptions((prev) => [...prev, { name: "", price: "", store: "", url: "" }]);
  }
  function setOptionRow(i: number, patch: Partial<DraftOption>) {
    setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  }
  function removeOptionRow(i: number) {
    setOptions((prev) => prev.filter((_, j) => j !== i));
  }

  function onSubmit(values: PurchaseInput) {
    // The item itself is just a thing to plan; its price/links live on options.
    const payload = { ...values, price: 0, url: "", store: "" };
    const optionInputs: PurchaseOptionInput[] = options
      .filter((o) => o.name.trim())
      .map((o) => ({
        name: o.name.trim(),
        price: Number(o.price) || 0,
        store: o.store.trim() || undefined,
        url: o.url.trim() || undefined,
        frequency: "one-off",
      }));
    startTransition(async () => {
      const result = editing
        ? await updatePurchase(purchase!.id, payload)
        : await createPurchaseWithOptions(payload, optionInputs);
      if (result?.error) {
        toast({ variant: "destructive", title: "Something went wrong", description: result.error });
        return;
      }
      toast({ title: editing ? "Purchase updated" : "Added to wishlist" });
      setOpen(false);
      if (!editing) {
        reset();
        setOptions([]);
      }
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
          <Field
            label="What do you want?"
            htmlFor="name"
            required
            error={errors.name?.message}
            tooltip="The thing you want (e.g. 'New sofa'). Add the specific products you're comparing as options."
          >
            <Input id="name" placeholder="e.g. New sofa" {...register("name")} />
          </Field>

          {!editing ? (
            <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Options to compare</p>
                <span className="text-xs text-muted-foreground">optional</span>
              </div>
              {options.length === 0 ? (
                <p className="text-xs text-muted-foreground">Add the specific products you&apos;re weighing up — each with its own price and link.</p>
              ) : (
                <div className="space-y-2">
                  {options.map((o, i) => (
                    <div key={i} className="space-y-1.5 rounded-md border bg-background p-2">
                      <div className="flex items-center gap-2">
                        <Input value={o.name} onChange={(e) => setOptionRow(i, { name: e.target.value })} placeholder="Option name (e.g. DFS Marlow)" className="h-9" />
                        <button type="button" onClick={() => removeOptionRow(i)} aria-label="Remove option" className="rounded-md p-2 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={o.price} onChange={(e) => setOptionRow(i, { price: e.target.value })} type="number" step="0.01" placeholder="Price £" className="h-9" />
                        <Input value={o.store} onChange={(e) => setOptionRow(i, { store: e.target.value })} placeholder="Store" className="h-9" />
                      </div>
                      <Input value={o.url} onChange={(e) => setOptionRow(i, { url: e.target.value })} type="url" placeholder="Link (optional)" className="h-9" />
                    </div>
                  ))}
                </div>
              )}
              <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 border-dashed" onClick={addOptionRow}>
                <Plus className="h-4 w-4" /> Add option
              </Button>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Use <span className="font-medium text-foreground">Add option</span> on the card to add or edit products to compare.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" tooltip="The broad type of item.">
              <NativeSelect {...register("category")}>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Size" tooltip="Is this a big-ticket purchase or a small everyday buy?">
              <NativeSelect {...register("size")}>
                <option value="">—</option>
                {PURCHASE_SIZES.map((s) => (
                  <option key={s} value={s}>{s} purchase</option>
                ))}
              </NativeSelect>
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
              {rooms.map((r) => (
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
