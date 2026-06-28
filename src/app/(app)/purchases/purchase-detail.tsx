"use client";

import * as React from "react";
import { CheckCircle2, ChevronDown, CircleDollarSign, Plus, Ruler, Star, Store } from "lucide-react";
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
import { cn, formatCurrency } from "@/lib/utils";
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
  categories = [],
  children,
}: {
  purchase: PurchaseWithOptions;
  memberMap: MemberMap;
  categories?: string[];
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
            {purchase.size ? <Detail label="Size" value={`${purchase.size} purchase`} /> : null}
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
          <DecisionCentre purchase={purchase} options={options} />
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
                  purchaseCategory={purchase.category}
                  option={opt}
                  isFirst={i === 0}
                  isLast={i === options.length - 1}
                />
              ))}
              <OptionForm
                purchaseId={purchase.id}
                purchaseCategory={purchase.category}
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
              <PurchaseForm purchase={purchase} members={Object.entries(memberMap).map(([id, name]) => ({ id, name }))} categories={categories} />
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

function DecisionCentre({
  purchase,
  options,
}: {
  purchase: PurchaseWithOptions;
  options: PurchaseOption[];
}) {
  const chosen = options.find((o) => o.is_chosen);
  const priced = options.filter((o) => Number.isFinite(Number(o.price)));
  const cheapest = priced.length
    ? priced.reduce((best, opt) => (Number(opt.price) < Number(best.price) ? opt : best), priced[0])
    : null;
  const topRated = options
    .filter((o) => o.rating != null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.rank - b.rank)[0];
  const fitted = options.filter((o) => o.width_cm != null && o.depth_cm != null);
  const isFurniture = purchase.category === "Furniture";
  const decision = chosen ?? topRated ?? cheapest ?? null;
  const basePrice = decision ? Number(decision.price) : Number(purchase.price);
  const priceSpread =
    priced.length > 1
      ? Math.max(...priced.map((o) => Number(o.price))) - Math.min(...priced.map((o) => Number(o.price)))
      : 0;
  const readySignals = [
    options.length > 0,
    Boolean(chosen || topRated),
    Boolean(!isFurniture || fitted.length),
    Boolean(purchase.non_negotiables || options.some((o) => o.notes)),
  ].filter(Boolean).length;

  const [open, setOpen] = React.useState(false);

  return (
    <div className="rounded-lg border bg-muted/25 p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <span>
          <span className="block text-sm font-semibold">Decision centre</span>
          <span className="block text-xs text-muted-foreground">
            {decision?.name ?? "No pick yet"} - {formatCurrency(basePrice)}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <Badge variant={readySignals >= 3 ? "success" : "secondary"}>
            {readySignals >= 3 ? "Ready" : `${readySignals}/4`}
          </Badge>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </span>
      </button>

      {open ? (
        <>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <DecisionMetric
              icon={CheckCircle2}
              label="Current pick"
              value={decision?.name ?? purchase.name}
              detail={decision ? formatCurrency(decision.price) : formatCurrency(purchase.price)}
            />
            <DecisionMetric
              icon={CircleDollarSign}
              label="Cheapest"
              value={cheapest?.name ?? "No option prices"}
              detail={cheapest ? formatCurrency(cheapest.price) : "Add options to compare"}
            />
            <DecisionMetric
              icon={Star}
              label="Top rated"
              value={topRated?.name ?? "No ratings yet"}
              detail={topRated?.rating ? `${topRated.rating}/5` : "Rate options to rank them"}
            />
            {isFurniture ? (
              <DecisionMetric
                icon={Ruler}
                label="Room fit"
                value={fitted.length ? `${fitted.length} measured` : "No measured options"}
                detail={fitted[0] ? `${fitted[0].width_cm} x ${fitted[0].depth_cm} cm` : "Add W/D for room planning"}
              />
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-background px-2 py-1">
              Decision cost: <span className="font-medium text-foreground">{formatCurrency(basePrice)}</span>
            </span>
            {priceSpread > 0 ? (
              <span className="rounded-full bg-background px-2 py-1">
                Price spread: <span className="font-medium text-foreground">{formatCurrency(priceSpread)}</span>
              </span>
            ) : null}
            {decision?.store ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1">
                <Store className="h-3 w-3" /> {decision.store}
              </span>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function DecisionMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="min-w-0 rounded-md bg-background p-2">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="truncate text-sm font-medium">{value}</p>
      <p className="truncate text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
