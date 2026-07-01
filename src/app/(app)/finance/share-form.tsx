"use client";

import * as React from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form-field";
import { FormDeleteButton } from "@/components/shared/form-delete-button";
import { useToast } from "@/hooks/use-toast";
import type { Share } from "@/lib/database.types";
import { createShare, updateShare, deleteShare } from "./actions";

type Props = { share?: Share; trigger?: React.ReactNode };

export function ShareForm({ share, trigger }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(share);

  const [ticker, setTicker] = React.useState(share?.ticker ?? "");
  const [quantity, setQuantity] = React.useState(share?.quantity != null ? String(share.quantity) : "");
  const [purchasePrice, setPurchasePrice] = React.useState(share?.purchase_price != null ? String(share.purchase_price) : "");
  const [purchaseDate, setPurchaseDate] = React.useState(share?.purchase_date ?? "");
  const [notes, setNotes] = React.useState(share?.notes ?? "");

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v && share) {
      setTicker(share.ticker);
      setQuantity(String(share.quantity));
      setPurchasePrice(String(share.purchase_price));
      setPurchaseDate(share.purchase_date ?? "");
      setNotes(share.notes ?? "");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticker.trim() || !quantity || !purchasePrice) return;
    startTransition(async () => {
      const payload = {
        ticker: ticker.trim(),
        quantity: Number(quantity),
        purchase_price: Number(purchasePrice),
        purchase_date: purchaseDate || undefined,
        notes: notes.trim() || undefined,
      };
      const result = editing ? await updateShare(share!.id, payload) : await createShare(payload);
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: editing ? "Holding updated" : "Holding added" });
      setOpen(false);
      if (!editing) {
        setTicker("");
        setQuantity("");
        setPurchasePrice("");
        setPurchaseDate("");
        setNotes("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5">
            {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Edit" : "Add shares"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit holding" : "Add a share holding"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Ticker" required hint="Include the market suffix, e.g. AAPL.US, VOD.UK">
            <Input placeholder="e.g. AAPL.US" value={ticker} onChange={(e) => setTicker(e.target.value)} required autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity" required>
              <Input type="number" step="0.0001" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </Field>
            <Field label="Purchase price (£)" required>
              <Input type="number" step="0.0001" min="0" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
            </Field>
          </div>
          <Field label="Purchase date">
            <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </Field>
          <Field label="Notes">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </Field>
          <DialogFooter className={editing ? "sm:justify-between" : undefined}>
            {editing && (
              <FormDeleteButton
                label="Delete holding"
                onDelete={async () => {
                  const r = await deleteShare(share!.id);
                  if (!r?.error) {
                    toast({ title: "Holding deleted" });
                    setOpen(false);
                  }
                  return r;
                }}
              />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {editing ? "Save changes" : "Add holding"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
