"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { AddedBy } from "@/components/shared/added-by";
import { FREQUENCY_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate, toAnnual, toMonthly } from "@/lib/utils";
import type { MemberMap } from "@/lib/household";
import type { Bill } from "@/lib/database.types";
import { useOpenFromUrl } from "@/hooks/use-open-from-url";
import { LinkedItems } from "@/app/(app)/links/linked-items";
import { BillForm } from "./bill-form";
import { deleteBill } from "./actions";

export function BillDetailDialog({
  bill,
  memberMap,
  children,
}: {
  bill: Bill;
  memberMap: MemberMap;
  children: React.ReactNode;
}) {
  const { open, onOpenChange } = useOpenFromUrl(bill.id);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {bill.name}
            <Badge variant="secondary">{bill.category}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Amount" value={formatCurrency(bill.amount)} />
            <Detail label="Frequency" value={FREQUENCY_LABELS[bill.frequency] ?? bill.frequency} />
            <Detail label="Monthly" value={formatCurrency(toMonthly(bill.amount, bill.frequency))} />
            <Detail label="Annual" value={formatCurrency(toAnnual(bill.amount, bill.frequency))} />
            <Detail label="Next due" value={formatDate(bill.due_date)} />
            <Detail label="Type" value={bill.is_fixed ? "Fixed" : "Variable"} />
            {bill.payment_account ? <Detail label="Account" value={bill.payment_account} /> : null}
          </div>
          {bill.notes ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Notes</p>
              <p className="text-sm">{bill.notes}</p>
            </div>
          ) : null}
          <div className="border-t pt-3">
            <LinkedItems type="bill" id={bill.id} />
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <AddedBy name={memberMap[bill.user_id]} />
            <div className="flex items-center gap-2">
              <BillForm bill={bill} />
              <ConfirmDelete itemLabel="bill" action={deleteBill.bind(null, bill.id)} variant="menu" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
