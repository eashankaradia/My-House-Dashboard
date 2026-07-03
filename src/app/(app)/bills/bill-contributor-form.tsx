"use client";

import * as React from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
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
import type { BillContributor, HouseholdMember } from "@/lib/database.types";
import { createBillContributor, updateBillContributor, deleteBillContributor } from "./actions";

type Props = {
  billId: string;
  members: HouseholdMember[];
  contributor?: BillContributor;
  trigger?: React.ReactNode;
};

export function BillContributorForm({ billId, members, contributor, trigger }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const editing = Boolean(contributor);

  const [memberId, setMemberId] = React.useState(contributor?.member_id ?? members[0]?.user_id ?? "");
  const [paysRest, setPaysRest] = React.useState(contributor ? contributor.amount == null : false);
  const [amount, setAmount] = React.useState(contributor?.amount != null ? String(contributor.amount) : "");
  const [startDate, setStartDate] = React.useState(contributor?.start_date ?? "");
  const [endDate, setEndDate] = React.useState(contributor?.end_date ?? "");

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v && contributor) {
      setMemberId(contributor.member_id);
      setPaysRest(contributor.amount == null);
      setAmount(contributor.amount != null ? String(contributor.amount) : "");
      setStartDate(contributor.start_date ?? "");
      setEndDate(contributor.end_date ?? "");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId) return;
    if (!paysRest && !amount) return;
    startTransition(async () => {
      const payload = {
        member_id: memberId,
        amount: paysRest ? null : Number(amount),
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };
      const result = editing
        ? await updateBillContributor(contributor!.id, payload)
        : await createBillContributor(billId, payload);
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: editing ? "Contributor updated" : "Contributor added" });
      setOpen(false);
      if (!editing) {
        setMemberId(members[0]?.user_id ?? "");
        setPaysRest(false);
        setAmount("");
        setStartDate("");
        setEndDate("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5">
            {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Edit" : "Add contributor"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit contributor" : "Add a contributor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Household member" required>
            <NativeSelect value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.display_name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="How much do they pay?">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaysRest(false)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${!paysRest ? "border-primary bg-primary/10" : "text-muted-foreground"}`}
              >
                Fixed amount
              </button>
              <button
                type="button"
                onClick={() => setPaysRest(true)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${paysRest ? "border-primary bg-primary/10" : "text-muted-foreground"}`}
              >
                Pays the rest
              </button>
            </div>
          </Field>

          {!paysRest && (
            <Field label="Amount (£)" required>
              <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date (optional)" hint="When this split began.">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="End date (optional)" hint="Leave blank if ongoing.">
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>

          <DialogFooter className={editing ? "sm:justify-between" : undefined}>
            {editing && (
              <FormDeleteButton
                label="Remove contributor"
                onDelete={async () => {
                  const r = await deleteBillContributor(contributor!.id);
                  if (!r?.error) {
                    toast({ title: "Contributor removed" });
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
                {editing ? "Save changes" : "Add contributor"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
