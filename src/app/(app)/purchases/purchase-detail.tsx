"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { AddedBy } from "@/components/shared/added-by";
import { ShareButton } from "@/components/shared/share-button";
import { ItemTimestamps } from "@/components/shared/item-timestamps";
import { ItemComments } from "@/components/shared/item-comments";
import { priorityVariant } from "@/lib/ui";
import { formatCurrency } from "@/lib/utils";
import type { MemberMap } from "@/lib/household";
import type { PurchaseOption, PurchaseWithOptions } from "@/lib/database.types";
import { PurchaseForm } from "./purchase-form";
import { OptionForm } from "./option-form";
import { OptionRow } from "./option-row";
import { useOpenFromUrl } from "@/hooks/use-open-from-url";
import { LinkedItems } from "@/app/(app)/links/linked-items";
import { deletePurchase } from "./actions";

export function PurchaseDetailDialog({
  purchase,
  memberMap,
  children,
}: {
  purchase: PurchaseWithOptions;
  memberMap: MemberMap;
  children: React.ReactNode;
}) {
  const { open, onOpenChange } = useOpenFromUrl(purchase.id);
  const options: PurchaseOption[] = [...purchase.options].sort(
    (a, b) => a.rank - b.rank || Number(a.price) - Number(b.price),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {purchase.name}
            <Badge variant={priorityVariant(purchase.priority)}>{purchase.priority}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Status" value={purchase.status} />
            <Detail label="Category" value={purchase.category} />
            {purchase.room ? <Detail label="Room" value={purchase.room} /> : null}
            {options.length === 0 ? <Detail label="Price" value={formatCurrency(purchase.price)} /> : null}
            {purchase.store ? <Detail label="Store" value={purchase.store} /> : null}
          </div>

          {purchase.notes ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Notes</p>
              <p className="text-sm">{purchase.notes}</p>
            </div>
          ) : null}
          {purchase.non_negotiables ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Non-negotiable features and qualities</p>
              <p className="whitespace-pre-wrap text-sm">{purchase.non_negotiables}</p>
            </div>
          ) : null}
          {purchase.status === "Purchased" &&
          (purchase.purchased_by || purchase.purchased_price != null || purchase.receipt_url) ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
              <p className="mb-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">Purchased</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {purchase.purchased_by ? (
                  <span>By <span className="font-medium">{memberMap[purchase.purchased_by] ?? "someone"}</span></span>
                ) : null}
                {purchase.purchased_price != null ? (
                  <span>Paid <span className="font-medium">{formatCurrency(purchase.purchased_price)}</span></span>
                ) : null}
                {purchase.receipt_url ? (
                  <a href={purchase.receipt_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    View receipt
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
          <ItemTimestamps createdAt={purchase.created_at} updatedAt={purchase.updated_at} />

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Options to compare ({options.length}) — ▲▼ to rank, ★ to pick
            </p>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <OptionRow
                  key={opt.id}
                  purchaseId={purchase.id}
                  option={opt}
                  isFirst={i === 0}
                  isLast={i === options.length - 1}
                />
              ))}
              <OptionForm
                purchaseId={purchase.id}
                trigger={
                  <Button variant="outline" size="sm" className="w-full gap-1 border-dashed">
                    <Plus className="h-4 w-4" /> Add option
                  </Button>
                }
              />
            </div>
          </div>

          <div className="border-t pt-3">
            <ItemComments entityType="purchases" entityId={purchase.id} ownerId={purchase.user_id} href={`/purchases?item=${purchase.id}`} label={purchase.name} />
          </div>

          <div className="border-t pt-3">
            <LinkedItems type="purchase" id={purchase.id} />
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <AddedBy name={memberMap[purchase.user_id]} />
            <div className="flex items-center gap-2">
              <ShareButton title={purchase.name} text={`${purchase.status} · ${purchase.category}`} />
              <PurchaseForm purchase={purchase} members={Object.entries(memberMap).map(([id, name]) => ({ id, name }))} />
              <ConfirmDelete itemLabel="item" action={deletePurchase.bind(null, purchase.id)} variant="menu" />
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
