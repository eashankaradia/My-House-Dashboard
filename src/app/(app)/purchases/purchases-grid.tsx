"use client";

import * as React from "react";
import { ChevronDown, LayoutGrid, Pencil, Plus, Rows3, ShoppingBag, Table2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { AddedBy } from "@/components/shared/added-by";
import { CardTrigger } from "@/components/shared/card-trigger";
import { StarRating } from "@/components/shared/star-rating";
import { useToast } from "@/hooks/use-toast";
import { useViewPref } from "@/hooks/use-view-prefs";
import { PURCHASE_SIZES, PURCHASE_STATUSES } from "@/lib/constants";
import { PRIORITY_ACCENT } from "@/lib/ui";
import { cn, formatCurrency } from "@/lib/utils";
import type { MemberMap } from "@/lib/household";
import type { PurchaseOption, PurchaseWithOptions } from "@/lib/database.types";
import { PurchaseForm } from "./purchase-form";
import { OptionForm } from "./option-form";
import { OptionRow } from "./option-row";
import { PurchaseDetailDialog } from "./purchase-detail";
import { deletePurchase, updatePurchaseStatus } from "./actions";

// Kept for backwards compatibility with the page's import; stars are gone.
export type StarInfo = { mine: boolean; names: string[] };

const SORTS = {
  rating: "Rating (high → low)",
  priority: "Priority",
  price: "Price (high → low)",
  room: "Room",
  category: "Category",
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

/** Effective rating: items rate themselves; items with options use their best option. */
function effectiveRating(p: PurchaseWithOptions): number {
  if (p.options.length) return Math.max(0, ...p.options.map((o) => o.rating ?? 0));
  return p.rating ?? 0;
}

export function PurchasesGrid({
  purchases,
  memberMap,
  currentUserId,
}: {
  purchases: PurchaseWithOptions[];
  memberMap: MemberMap;
  starInfo?: Record<string, StarInfo>;
  currentUserId?: string;
}) {
  const [status, setStatus] = React.useState<string>("All");
  const [room, setRoom] = React.useState<string>("All");
  const [size, setSize] = React.useState<string>("All");
  const [minRating, setMinRating] = React.useState<number>(0);
  const [sort, setSort] = React.useState<keyof typeof SORTS>("rating");
  const [view, setView] = useViewPref("purchases");
  const [onlyMine, setOnlyMine] = React.useState(false);

  const rooms = Array.from(new Set(purchases.map((p) => p.room).filter(Boolean))) as string[];
  const rank = { High: 0, Medium: 1, Low: 2 } as const;

  const filtered = purchases
    .filter((p) => (!onlyMine ? true : p.user_id === currentUserId))
    .filter((p) => (status === "All" ? true : p.status === status))
    .filter((p) => (room === "All" ? true : p.room === room))
    .filter((p) => (size === "All" ? true : (p.size ?? "") === size))
    .filter((p) => (minRating === 0 ? true : effectiveRating(p) >= minRating))
    .sort((a, b) => {
      switch (sort) {
        case "rating":
          return effectiveRating(b) - effectiveRating(a) || rank[a.priority] - rank[b.priority];
        case "price":
          return effectivePrice(b) - effectivePrice(a);
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
        <div className="flex items-center rounded-lg border p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setOnlyMine(false)}
            className={cn("rounded-md px-2.5 py-1", !onlyMine && "bg-accent")}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setOnlyMine(true)}
            className={cn("rounded-md px-2.5 py-1", onlyMine && "bg-accent")}
          >
            Mine
          </button>
        </div>
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
        <NativeSelect value={size} onChange={(e) => setSize(e.target.value)} className="h-9 w-auto text-sm">
          <option value="All">Any size</option>
          {PURCHASE_SIZES.map((s) => (
            <option key={s} value={s}>{s} purchases</option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={String(minRating)}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="h-9 w-auto text-sm"
        >
          <option value="0">Any rating</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}★ and up</option>
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
          <span className="text-sm text-muted-foreground">{filtered.length} items</span>
          <div className="flex items-center rounded-lg border p-0.5">
            <button
              onClick={() => setView("detailed")}
              aria-label="Card view"
              className={cn("rounded-md p-1.5 text-muted-foreground", view === "detailed" && "bg-accent text-foreground")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("compact")}
              aria-label="Compact list"
              className={cn("rounded-md p-1.5 text-muted-foreground", view === "compact" && "bg-accent text-foreground")}
            >
              <Rows3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("table")}
              aria-label="Table view"
              className={cn("rounded-md p-1.5 text-muted-foreground", view === "table" && "bg-accent text-foreground")}
            >
              <Table2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Nothing here" description="No items match this filter yet." />
      ) : view === "compact" ? (
        <Card>
          <CardContent className="divide-y p-0">
            {filtered.map((purchase) => (
              <CompactRow key={purchase.id} purchase={purchase} memberMap={memberMap} />
            ))}
          </CardContent>
        </Card>
      ) : view === "table" ? (
        <PurchaseTable purchases={filtered} memberMap={memberMap} />
      ) : (
        <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((purchase, i) => (
            // Only the top-rated item starts expanded; the rest are pre-collapsed.
            <PurchaseCard key={purchase.id} purchase={purchase} memberMap={memberMap} defaultOpen={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}

function PurchaseTable({
  purchases,
  memberMap,
}: {
  purchases: PurchaseWithOptions[];
  memberMap: MemberMap;
}) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Item</th>
              <th className="px-3 py-2 font-medium">Room</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Rating</th>
              <th className="px-3 py-2 text-right font-medium">Price</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} className={cn("border-b border-l-4 last:border-b-0", PRIORITY_ACCENT[p.priority])}>
                <td className="px-3 py-2">
                  <PurchaseDetailDialog purchase={p} memberMap={memberMap}>
                    <CardTrigger className="rounded font-medium hover:underline">{p.name}</CardTrigger>
                  </PurchaseDetailDialog>
                  {p.options.length ? <span className="ml-1 text-xs text-muted-foreground">({p.options.length})</span> : null}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{p.room ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{p.category}</td>
                <td className="px-3 py-2">
                  <StarRating value={effectiveRating(p)} size="sm" />
                </td>
                <td className="px-3 py-2 text-right font-medium">{formatCurrency(effectivePrice(p))}</td>
                <td className="px-3 py-2 text-muted-foreground">{p.status}</td>
                <td className="px-3 py-2 text-right">
                  <ConfirmDelete itemLabel="item" action={deletePurchase.bind(null, p.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
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
}: {
  purchase: PurchaseWithOptions;
  memberMap: MemberMap;
}) {
  const opts = sortedOptions(purchase);
  const members = Object.entries(memberMap).map(([id, name]) => ({ id, name }));
  return (
    <div className={cn("flex items-center gap-3 border-l-4 px-4 py-2.5 text-sm", PRIORITY_ACCENT[purchase.priority])}>
      <PurchaseDetailDialog purchase={purchase} memberMap={memberMap}>
        <CardTrigger className="min-w-0 flex-1 rounded-md">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{purchase.name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">
              {[purchase.category, purchase.room].filter(Boolean).join(" · ")}
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
          members={members}
          trigger={
            <button className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
              <Pencil className="h-4 w-4" />
              Edit
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
  defaultOpen = false,
}: {
  purchase: PurchaseWithOptions;
  memberMap: MemberMap;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const options = sortedOptions(purchase);
  const members = Object.entries(memberMap).map(([id, name]) => ({ id, name }));
  const prices = options.map((o) => Number(o.price));
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const chosen = options.find((o) => o.is_chosen);

  return (
    <Card className={cn("flex flex-col border-l-4", PRIORITY_ACCENT[purchase.priority])}>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <PurchaseDetailDialog purchase={purchase} memberMap={memberMap}>
            <CardTrigger className="min-w-0 flex-1 rounded-md">
              <span className="truncate font-medium hover:underline">{purchase.name}</span>
              <p className="text-xs text-muted-foreground">
                {purchase.category}
                {purchase.room ? ` · ${purchase.room}` : ""}
              </p>
            </CardTrigger>
          </PurchaseDetailDialog>
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
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {options.length} option{options.length === 1 ? "" : "s"}
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </button>
        </div>

        {open ? (
          <>
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
          </>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
          <AddedBy name={memberMap[purchase.user_id]} />
          <div className="flex items-center gap-2">
            <div className="w-32">
              <StatusSelect purchase={purchase} />
            </div>
            <PurchaseForm
              purchase={purchase}
              members={members}
              trigger={
                <button className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                  <Pencil className="h-4 w-4" />
                  Edit
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
