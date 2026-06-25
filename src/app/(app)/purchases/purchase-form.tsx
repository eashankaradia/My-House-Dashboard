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
import { useToast } from "@/hooks/use-toast";
import {
  PRIORITIES,
  PURCHASE_CATEGORIES,
  PURCHASE_STATUSES,
  PURCHASE_SUBCATEGORIES,
  ROOMS,
} from "@/lib/constants";
import { purchaseSchema, type PurchaseInput } from "@/lib/schemas";
import type { Purchase } from "@/lib/database.types";
import { createPurchase, deletePurchase, setPurchaseArchived, updatePurchase } from "./actions";

type Props = {
  purchase?: Purchase;
  trigger?: React.ReactNode;
  defaults?: Partial<PurchaseInput>;
};

export function PurchaseForm({ purchase, trigger, defaults }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(purchase);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PurchaseInput>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      name: purchase?.name ?? defaults?.name ?? "",
      url: purchase?.url ?? defaults?.url ?? "",
      store: purchase?.store ?? "",
      price: purchase?.price ?? 0,
      category: purchase?.category ?? defaults?.category ?? "Furniture",
      sub_category: purchase?.sub_category ?? defaults?.sub_category ?? "",
      room: purchase?.room ?? defaults?.room ?? "",
      priority: purchase?.priority ?? defaults?.priority ?? "Medium",
      status: purchase?.status ?? "Considering",
      non_negotiables: purchase?.non_negotiables ?? "",
      notes: purchase?.notes ?? "",
    },
  });

  // Suggestions update to match the currently-selected category.
  const selectedCategory = watch("category");
  const subSuggestions = PURCHASE_SUBCATEGORIES[selectedCategory] ?? [];

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
            <Field label="Category" tooltip="The broad type of item. Choosing a category updates the sub-category suggestions below.">
              <NativeSelect {...register("category")}>
                {PURCHASE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field
              label="Sub-category"
              htmlFor="sub_category"
              tooltip="A more specific type, e.g. Sofa, Bed or Wardrobe. Pick a suggestion or type your own."
            >
              <Input
                id="sub_category"
                list="subcategory-options"
                placeholder={subSuggestions[0] ? `e.g. ${subSuggestions[0]}` : "e.g. Sofa"}
                {...register("sub_category")}
              />
              <datalist id="subcategory-options">
                {subSuggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
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
