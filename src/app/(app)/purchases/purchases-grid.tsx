"use client";

import * as React from "react";
import { ExternalLink, Pencil, Plus, ShoppingBag, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { useToast } from "@/hooks/use-toast";
import { PURCHASE_STATUSES } from "@/lib/constants";
import { priorityVariant } from "@/lib/ui";
import { cn, formatCurrency } from "@/lib/utils";
import type { PurchaseOption, PurchaseWithOptions } from "@/lib/database.types";
import { PurchaseForm } from "./purchase-form";
import { OptionForm } from "./option-form";
import {
  chooseOption,
  deleteOption,
  deletePurchase,
  updatePurchaseStatus,
} from "./actions";

const SORTS = {
  priority: "Priority",
  price: "Price (high → low)",
  room: "Room",
  category: "Category",
  sub_category: "Sub-category",
} as const;

/** Effective price for an item: chosen option → cheapest option → item price. */
function effectivePrice(p: PurchaseWithOptions): number {
  const chosen = p.options.find((o) => o.is_chosen);
  if (chosen) return Number(chosen.price);
  if (p.options.length) return Math.min(...p.options.map((o) => Number(o.price)));
  return Number(p.price);
}

export function PurchasesGrid({ purchases }: { purchases: PurchaseWithOptions[] }) {
  const [status, setStatus] = React.useState<string>("All");
  const [sort, setSort] = React.useState<keyof typeof SORTS>("priority");

  const rank = { High: 0, Medium: 1, Low: 2 } as const;

  const filtered = purchases
    .filter((p) => (status === "All" ? true : p.status === status))
    .sort((a, b) => {
      switch (sort) {
        case "price":
          return effectivePrice(b) - effectivePrice(a);
        case "room":
          return (a.room ?? "~").localeCompare(b.room ?? "~");
        case "category":
          return a.category.localeCompare(b.category);
        case "sub_category":
          return (a.sub_category ?? "~").localeCompare(b.sub_category ?? "~");
        default:
          return rank[a.priority] - rank[b.priority];
      }
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 w-auto text-sm">
          <option value="All">All statuses</option>
          {PURCHASE_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={sort}
          onChange={(e) => setSort(e.target.value as keyof typeof SORTS)}
          className="h-9 w-auto text-sm"
        >
          {Object.entries(SORTS).map(([k, label]) => (
            <option key={k} value={k}>Sort: {label}</option>
          ))}
        </NativeSelect>
        <span className="ml-auto text-sm text-muted-foreground">{filtered.length} items</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Nothing here" description="No items match this filter yet." />
      ) : (
        <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((purchase) => (
            <PurchaseCard key={purchase.id} purchase={purchase} />
          ))}
        </div>
      )}
    </div>
  );
}

function PurchaseCard({ purchase }: { purchase: PurchaseWithOptions }) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const options = [...purchase.options].sort((a, b) => Number(a.price) - Number(b.price));
  const prices = options.map((o) => Number(o.price));
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const chosen = options.find((o) => o.is_chosen);

  function move(status: string) {
    startTransition(async () => {
      const res = await updatePurchaseStatus(purchase.id, status);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't update", description: res.error });
    });
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{purchase.name}</p>
            <p className="text-xs text-muted-foreground">
              {purchase.sub_category ? `${purchase.category} · ${purchase.sub_category}` : purchase.category}
              {purchase.room ? ` · ${purchase.room}` : ""}
            </p>
          </div>
          <Badge variant={priorityVariant(purchase.priority)}>{purchase.priority}</Badge>
        </div>

        {/* Price summary across options */}
        <div className="flex items-baseline justify-between gap-2">
          {options.length === 0 ? (
            <span className="text-lg font-semibold">{formatCurrency(purchase.price)}</span>
          ) : chosen ? (
            <span className="text-lg font-semibold text-primary">
              {formatCurrency(chosen.price)} <span className="text-xs font-normal text-muted-foreground">picked</span>
            </span>
          ) : (
            <span className="text-lg font-semibold">
              {min === max ? formatCurrency(min) : `${formatCurrency(min)} – ${formatCurrency(max)}`}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {options.length} option{options.length === 1 ? "" : "s"}
          </span>
        </div>

        {purchase.notes ? <p className="line-clamp-2 text-sm text-muted-foreground">{purchase.notes}</p> : null}

        {/* Options list */}
        <div className="space-y-2">
          {options.map((opt) => (
            <OptionRow key={opt.id} purchaseId={purchase.id} option={opt} />
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

        {/* Footer: status + item actions */}
        <div className="mt-auto flex items-center gap-2 border-t pt-3">
          <NativeSelect
            value={purchase.status}
            disabled={pending}
            onChange={(e) => move(e.target.value)}
            className="h-8 flex-1 text-xs"
          >
            {PURCHASE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </NativeSelect>
          <PurchaseForm
            purchase={purchase}
            trigger={
              <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Edit item">
                <Pencil className="h-4 w-4" />
              </button>
            }
          />
          <ConfirmDelete itemLabel="item" action={deletePurchase.bind(null, purchase.id)} />
        </div>
      </CardContent>
    </Card>
  );
}

function OptionRow({ purchaseId, option }: { purchaseId: string; option: PurchaseOption }) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function pick() {
    startTransition(async () => {
      const res = await chooseOption(purchaseId, option.id);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't pick", description: res.error });
    });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border p-2",
        option.is_chosen ? "border-primary/40 bg-primary/5" : "bg-card",
      )}
    >
      {option.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={option.image_url} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{option.name}</p>
          {option.is_chosen ? <Badge variant="success">Picked</Badge> : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {[option.store, option.notes].filter(Boolean).join(" · ") || " "}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-sm font-semibold">{formatCurrency(option.price)}</span>
        {option.url ? (
          <a
            href={option.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-[11px] text-primary hover:underline"
          >
            View <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center">
        <button
          onClick={pick}
          disabled={pending}
          aria-label={option.is_chosen ? "Chosen option" : "Pick this option"}
          className={cn(
            "rounded-md p-1.5 transition-colors hover:bg-accent",
            option.is_chosen ? "text-amber-500" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Star className={cn("h-4 w-4", option.is_chosen && "fill-amber-500")} />
        </button>
        <OptionForm
          purchaseId={purchaseId}
          option={option}
          trigger={
            <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Edit option">
              <Pencil className="h-4 w-4" />
            </button>
          }
        />
        <ConfirmDelete itemLabel="option" action={deleteOption.bind(null, option.id)} />
      </div>
    </div>
  );
}
