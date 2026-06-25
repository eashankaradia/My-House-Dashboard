"use client";

import * as React from "react";
import { LayoutGrid, Pencil, Plus, Rows3, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { AddedBy } from "@/components/shared/added-by";
import { CardTrigger } from "@/components/shared/card-trigger";
import { ExportButton } from "@/components/shared/export-button";
import { useToast } from "@/hooks/use-toast";
import { PURCHASE_STATUSES } from "@/lib/constants";
import { priorityVariant } from "@/lib/ui";
import { cn, formatCurrency } from "@/lib/utils";
import type { MemberMap } from "@/lib/household";
import type { PurchaseOption, PurchaseWithOptions } from "@/lib/database.types";
import { PurchaseForm } from "./purchase-form";
import { OptionForm } from "./option-form";
import { OptionRow } from "./option-row";
import { PurchaseDetailDialog } from "./purchase-detail";
import { StarButton } from "./star-button";
import { deletePurchase, updatePurchaseStatus } from "./actions";

export type StarInfo = { mine: boolean; names: string[] };
const noStar: StarInfo = { mine: false, names: [] };

const SORTS = {
  priority: "Priority",
  price: "Price (high → low)",
  room: "Room",
  category: "Category",
  sub_category: "Sub-category",
} as const;

function sortedOptions(p: PurchaseWithOptions): PurchaseOption[] {
  return [...p.options].sort((a, b) => a.rank - b.rank || Number(a.price) - Number(b.price));
}

/** Effective price: chosen option → top-ranked/cheapest option → item price. */
function effectivePrice(p: PurchaseWithOptions): number {
  const chosen = p.options.find((o) => o.is_chosen);
  if (chosen) return Number(chosen.price);
  const opts = sortedOptions(p);
  if (opts.length) return Number(opts[0].price);
  return Number(p.price);
}

export function PurchasesGrid({
  purchases,
  memberMap,
  starInfo,
}: {
  purchases: PurchaseWithOptions[];
  memberMap: MemberMap;
  starInfo: Record<string, StarInfo>;
}) {
  const [status, setStatus] = React.useState<string>("All");
  const [room, setRoom] = React.useState<string>("All");
  const [sort, setSort] = React.useState<keyof typeof SORTS>("priority");
  const [compact, setCompact] = React.useState(false);

  const rooms = Array.from(new Set(purchases.map((p) => p.room).filter(Boolean))) as string[];
  const rank = { High: 0, Medium: 1, Low: 2 } as const;

  const filtered = purchases
    .filter((p) => (status === "All" ? true : p.status === status))
    .filter((p) => (room === "All" ? true : p.room === room))
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
        <NativeSelect value={room} onChange={(e) => setRoom(e.target.value)} className="h-9 w-auto text-sm">
          <option value="All">All rooms</option>
          {rooms.map((r) => (
            <option key={r} value={r}>{r}</option>
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

        <div className="ml-auto flex items-center gap-2">
          <ExportButton
            filename="wishlist"
            rows={filtered.map((p) => ({
              name: p.name,
              category: p.category,
              sub_category: p.sub_category,
              room: p.room,
              priority: p.priority,
              status: p.status,
              options: p.options.length,
              price: effectivePrice(p),
            }))}
            columns={["name", "category", "sub_category", "room", "priority", "status", "options", "price"]}
          />
          <span className="text-sm text-muted-foreground">{filtered.length} items</span>
          <div className="flex items-center rounded-lg border p-0.5">
            <button
              onClick={() => setCompact(false)}
              aria-label="Card view"
              className={cn("rounded-md p-1.5 text-muted-foreground", !compact && "bg-accent text-foreground")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCompact(true)}
              aria-label="Compact list"
              className={cn("rounded-md p-1.5 text-muted-foreground", compact && "bg-accent text-foreground")}
            >
              <Rows3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Nothing here" description="No items match this filter yet." />
      ) : compact ? (
        <Card>
          <CardContent className="divide-y p-0">
            {filtered.map((purchase) => (
              <CompactRow key={purchase.id} purchase={purchase} memberMap={memberMap} star={starInfo[purchase.id] ?? noStar} />
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((purchase) => (
            <PurchaseCard key={purchase.id} purchase={purchase} memberMap={memberMap} star={starInfo[purchase.id] ?? noStar} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusSelect({ purchase }: { purchase: PurchaseWithOptions }) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  return (
    <NativeSelect
      value={purchase.status}
      disabled={pending}
      onChange={(e) =>
        startTransition(async () => {
          const res = await updatePurchaseStatus(purchase.id, e.target.value);
          if (res?.error) toast({ variant: "destructive", title: "Couldn't update", description: res.error });
        })
      }
      className="h-8 text-xs"
    >
      {PURCHASE_STATUSES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </NativeSelect>
  );
}

function CompactRow({
  purchase,
  memberMap,
  star,
}: {
  purchase: PurchaseWithOptions;
  memberMap: MemberMap;
  star: StarInfo;
}) {
  const opts = sortedOptions(purchase);
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 text-sm">
      <StarButton purchaseId={purchase.id} mine={star.mine} names={star.names} />
      <PurchaseDetailDialog purchase={purchase} memberMap={memberMap}>
        <CardTrigger className="min-w-0 flex-1 rounded-md">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{purchase.name}</span>
            <Badge variant={priorityVariant(purchase.priority)}>{purchase.priority}</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">
              {[purchase.sub_category || purchase.category, purchase.room].filter(Boolean).join(" · ")}
              {opts.length ? ` · ${opts.length} option${opts.length === 1 ? "" : "s"}` : ""}
            </span>
            <AddedBy name={memberMap[purchase.user_id]} />
          </div>
        </CardTrigger>
      </PurchaseDetailDialog>
      <span className="shrink-0 font-semibold">{formatCurrency(effectivePrice(purchase))}</span>
      <div className="hidden w-32 shrink-0 sm:block">
        <StatusSelect purchase={purchase} />
      </div>
      <div className="flex shrink-0 items-center">
        <PurchaseForm
          purchase={purchase}
          trigger={
            <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </button>
          }
        />
        <ConfirmDelete itemLabel="item" action={deletePurchase.bind(null, purchase.id)} />
      </div>
    </div>
  );
}

function PurchaseCard({
  purchase,
  memberMap,
  star,
}: {
  purchase: PurchaseWithOptions;
  memberMap: MemberMap;
  star: StarInfo;
}) {
  const options = sortedOptions(purchase);
  const prices = options.map((o) => Number(o.price));
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const chosen = options.find((o) => o.is_chosen);

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <PurchaseDetailDialog purchase={purchase} memberMap={memberMap}>
            <CardTrigger className="min-w-0 flex-1 rounded-md">
              <span className="truncate font-medium hover:underline">{purchase.name}</span>
              <p className="text-xs text-muted-foreground">
                {purchase.sub_category ? `${purchase.category} · ${purchase.sub_category}` : purchase.category}
                {purchase.room ? ` · ${purchase.room}` : ""}
              </p>
            </CardTrigger>
          </PurchaseDetailDialog>
          <div className="flex shrink-0 items-center gap-1">
            <StarButton purchaseId={purchase.id} mine={star.mine} names={star.names} />
            <Badge variant={priorityVariant(purchase.priority)}>{purchase.priority}</Badge>
          </div>
        </div>

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

        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
          <AddedBy name={memberMap[purchase.user_id]} />
          <div className="flex items-center gap-2">
            <div className="w-32">
              <StatusSelect purchase={purchase} />
            </div>
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
        </div>
      </CardContent>
    </Card>
  );
}

