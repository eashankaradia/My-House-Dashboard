"use client";

import * as React from "react";
import { ExternalLink, Pencil, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { useToast } from "@/hooks/use-toast";
import { PURCHASE_STATUSES } from "@/lib/constants";
import { priorityVariant } from "@/lib/ui";
import { formatCurrency } from "@/lib/utils";
import type { Purchase } from "@/lib/database.types";
import { PurchaseForm } from "./purchase-form";
import { deletePurchase, updatePurchaseStatus } from "./actions";

const SORTS = {
  priority: "Priority",
  price: "Price (high → low)",
  room: "Room",
  category: "Category",
} as const;

export function PurchasesGrid({ purchases }: { purchases: Purchase[] }) {
  const [status, setStatus] = React.useState<string>("All");
  const [sort, setSort] = React.useState<keyof typeof SORTS>("priority");

  const rank = { High: 0, Medium: 1, Low: 2 } as const;

  const filtered = purchases
    .filter((p) => (status === "All" ? true : p.status === status))
    .sort((a, b) => {
      switch (sort) {
        case "price":
          return Number(b.price) - Number(a.price);
        case "room":
          return (a.room ?? "~").localeCompare(b.room ?? "~");
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return rank[a.priority] - rank[b.priority];
      }
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 w-auto text-sm"
        >
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((purchase) => (
            <PurchaseCard key={purchase.id} purchase={purchase} />
          ))}
        </div>
      )}
    </div>
  );
}

function PurchaseCard({ purchase }: { purchase: Purchase }) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

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
              {purchase.category}
              {purchase.room ? ` · ${purchase.room}` : ""}
              {purchase.store ? ` · ${purchase.store}` : ""}
            </p>
          </div>
          <Badge variant={priorityVariant(purchase.priority)}>{purchase.priority}</Badge>
        </div>

        {purchase.notes ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{purchase.notes}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-lg font-semibold">{formatCurrency(purchase.price)}</span>
          {purchase.url ? (
            <a
              href={purchase.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>

        <div className="flex items-center gap-2 border-t pt-3">
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
              <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
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
