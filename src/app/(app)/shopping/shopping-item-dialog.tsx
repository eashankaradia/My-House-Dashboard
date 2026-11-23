"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { addShoppingItem } from "./actions";

/** Quick-add for the shared shopping list, used from the global + menu. */
export function ShoppingItemDialog({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function reset() {
    setName("");
    setQuantity("");
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await addShoppingItem({ name, quantity });
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't add it", description: res.error });
        return;
      }
      toast({ title: "Added to the shopping list" });
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to shopping list</DialogTitle>
          <DialogDescription>Everyone in the household sees the same list.</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <Field label="What do you need?" htmlFor="shopping-name" required>
            <Input
              id="shopping-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Milk"
            />
          </Field>
          <Field label="Quantity" htmlFor="shopping-qty" hint="Optional — e.g. 2, 1kg">
            <Input
              id="shopping-qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="2"
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
