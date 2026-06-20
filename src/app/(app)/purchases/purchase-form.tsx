"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
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
import { PRIORITIES, PURCHASE_CATEGORIES, PURCHASE_STATUSES, ROOMS } from "@/lib/constants";
import { purchaseSchema, type PurchaseInput } from "@/lib/schemas";
import type { Purchase } from "@/lib/database.types";
import { createPurchase, updatePurchase } from "./actions";

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
      priority: purchase?.priority ?? defaults?.priority ?? "Medium",
      status: purchase?.status ?? "Considering",
      notes: purchase?.notes ?? "",
    },
  });

  function onSubmit(values: PurchaseInput) {
    startTransition(async () => {
      const result = editing ? await updatePurchase(purchase!.id, values) : await createPurchase(values);
      if (result?.error) {
        toast({ variant: "destructive", title: "Something went wrong", description: result.error });
        return;
      }
      toast({ title: editing ? "Purchase updated" : "Added to wishlist" });
      setOpen(false);
      if (!editing) reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" /> Add item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit item" : "Add to wishlist"}</DialogTitle>
          <DialogDescription>Something you&apos;d love for the home — now or later.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Item name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" placeholder="e.g. Corner sofa" {...register("name")} />
          </Field>
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <NativeSelect {...register("category")}>
                {PURCHASE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Room">
              <NativeSelect {...register("room")}>
                <option value="">—</option>
                {ROOMS.map((r) => (
                  <option key={r} value={r}>{r}</option>
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
                {PURCHASE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" rows={2} {...register("notes")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
