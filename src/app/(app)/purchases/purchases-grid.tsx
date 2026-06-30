"use client";

import * as React from "react";
import { ChevronDown, Filter, LayoutGrid, Pencil, Plus, Rows3, ShoppingBag, Table2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { AddedBy } from "@/components/shared/added-by";
import { CardTrigger } from "@/components/shared/card-trigger";
import { StarRating } from "@/components/shared/star-rating";
import { useToast } from "@/hooks/use-toast";
import { useViewPref } from "@/hooks/use-view-prefs";
import { useIsMobile } from "@/hooks/use-is-mobile";
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

/** Effective rating: ratings live on options only — an item's score is its best option. */
function effectiveRating(p: PurchaseWithOptions): number {
  if (!p.options.length) return 0;
  return Math.max(0, ...p.options.map((o) => o.rating ?? 0));
}

export function PurchasesGrid({
  purchases,
  memberMap,
  currentUserId,
  categories,
}: {
  purchases: PurchaseWithOptions[];
  memberMap: MemberMap;
  starInfo?: Record<string, StarInfo>;
  currentUserId?: string;
  categories: string[];
}) {
  const [status, setStatus] = React.useState<string>("All");
  const [room, setRoom] = React.useState<string>("All");
  const [category, setCategory] = React.useState<string>("All");
  const [size, setSize] = React.useState<string>("All");
  const [minRating, setMinRating] = React.useState<number>(0);
  const [sort, setSort] = React.useState<keyof typeof SORTS>("rating");
  const [view, setView] = useViewPref("purchases");
  // The table scrolls sideways on phones — fall back to cards there.
  const isMobile = useIsMobile();
  const effectiveView = isMobile && view === "table" ? "detailed" : view;
  const [onlyMine, setOnlyMine] = React.useState(process.env.NEXT_PUBLIC_APP === "life");
  const [hideNoOptions, setHideNoOptions] = React.useState(false);

  const rooms = Array.from(new Set(purchases.map((p) => p.room).filter(Boolean))) as string[];
  const rank = { High: 0, Medium: 1, Low: 2 } as const;
  const activeFilters = [
    onlyMine ? { label: "Mine", clear: () => setOnlyMine(false) } : null,
    hideNoOptions ? { label: "Has options", clear: () => setHideNoOptions(false) } : null,
    status !== "All" ? { label: status, clear: () => setStatus("All") } : null,
    room !== "All" ? { label: room, clear: () => setRoom("All") } : null,
    category !== "All" ? { label: category, clear: () => setCategory("All") } : null,
    size !== "All" ? { label: `${size} purchases`, clear: () => setSize("All") } : null,
    minRating > 0 ? { label: `${minRating}+ stars`, clear: () => setMinRating(0) } : null,
  ].filter((filter): filter is { label: string; clear: () => void } => Boolean(filter));

  const filtered = purchases
    .filter((p) => (!onlyMine ? true : p.user_id === currentUserId))
    .filter((p) => (!hideNoOptions ? true : p.options.length > 0))
    .filter((p) => (status === "All" ? true : p.status === status))
    .filter((p) => (room === "All" ? true : p.room === room))
    .filter((p) => (category === "All" ? true : p.category === category))
    .filter((p) => (size === "All" ? true : (p.size ?? "") === size))
    .filter((p) => (minRating === 0 ? true : effectiveRating(p) >= minRating))
    .sort((a, b) => {
      const optionless = Number(a.options.length === 0) - Number(b.options.length === 0);
      if (optionless !== 0) return optionless;
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
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 rounded-full border bg-background px-3 shadow-sm lg:hidden">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilters.length ? (
                <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                  {activeFilters.length}
                </span>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
            <SheetTitle>Purchase filters</SheetTitle>
            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Owner</p>
                <div className="flex items-center rounded-lg border p-0.5 text-sm">
                  <button
                    type="button"
                    onClick={() => setOnlyMine(false)}
                    className={cn("flex-1 rounded-md px-2.5 py-1.5", !onlyMine && "bg-accent")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlyMine(true)}
                    className={cn("flex-1 rounded-md px-2.5 py-1.5", onlyMine && "bg-accent")}
                  >
                    Mine
                  </button>
                </div>
              </div>
              <FilterSelect label="Status" value={status} onChange={setStatus}>
                <option value="All">All statuses</option>
                {PURCHASE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </FilterSelect>
              <FilterSelect label="Room" value={room} onChange={setRoom}>
                <option value="All">All rooms</option>
                {rooms.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </FilterSelect>
              <FilterSelect label="Category" value={category} onChange={setCategory}>
                <option value="All">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </FilterSelect>
              <FilterSelect label="Size" value={size} onChange={setSize}>
                <option value="All">Any size</option>
                {PURCHASE_SIZES.map((s) => (
                  <option key={s} value={s}>{s} purchases</option>
                ))}
              </FilterSelect>
              <FilterSelect label="Rating" value={String(minRating)} onChange={(v) => setMinRating(Number(v))}>
                <option value="0">Any rating</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} stars and up</option>
                ))}
              </FilterSelect>
              <button
                type="button"
                onClick={() => setHideNoOptions((v) => !v)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  hideNoOptions && "bg-accent text-foreground",
                )}
              >
                Hide items with no options
              </button>
            </div>
          </SheetContent>
        </Sheet>
        {activeFilters.map((filter) => (
          <button
            key={filter.label}
            type="button"
            onClick={filter.clear}
            className="inline-flex max-w-[10rem] items-center gap-1 rounded-full border bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
          >
            <span className="truncate">{filter.label}</span>
            <X className="h-3 w-3" />
          </button>
        ))}
        <div className="hidden items-center rounded-lg border p-0.5 text-sm lg:flex">
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
        <button
          type="button"
          onClick={() => setHideNoOptions((v) => !v)}
          className={cn(
            "hidden rounded-lg border px-3 py-2 text-sm transition-colors lg:inline-flex",
            hideNoOptions && "bg-accent text-foreground",
          )}
        >
          {hideNoOptions ? "Showing items with options" : "Hide items with no options"}
        </button>
        <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)} className="hidden h-9 w-auto text-sm lg:block">
          <option value="All">All statuses</option>
          {PURCHASE_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </NativeSelect>
        <NativeSelect value={room} onChange={(e) => setRoom(e.target.value)} className="hidden h-9 w-auto text-sm lg:block">
          <option value="All">All rooms</option>
          {rooms.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </NativeSelect>
        <NativeSelect value={category} onChange={(e) => setCategory(e.target.value)} className="hidden h-9 w-auto text-sm lg:block">
          <option value="All">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </NativeSelect>
        <NativeSelect value={size} onChange={(e) => setSize(e.target.value)} className="hidden h-9 w-auto text-sm lg:block">
          <option value="All">Any size</option>
          {PURCHASE_SIZES.map((s) => (
            <option key={s} value={s}>{s} purchases</option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={String(minRating)}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="hidden h-9 w-auto text-sm lg:block"
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
              className={cn("hidden rounded-md p-1.5 text-muted-foreground sm:block", view === "table" && "bg-accent text-foreground")}
            >
              <Table2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Nothing here" description="No items match this filter yet." />
      ) : effectiveView === "compact" ? (
        <Card>
          <CardContent className="divide-y p-0">
            {filtered.map((purchase) => (
              <CompactRow key={purchase.id} purchase={purchase} memberMap={memberMap} categories={categories} />
            ))}
          </CardContent>
        </Card>
      ) : effectiveView === "table" ? (
        <PurchaseTable purchases={filtered} memberMap={memberMap} />
      ) : (
        <div className="grid min-w-0 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
          {filtered.map((purchase, i) => (
            // Only the top-rated item starts expanded; the rest are pre-collapsed.
            <PurchaseCard key={purchase.id} purchase={purchase} memberMap={memberMap} defaultOpen={i === 0} categories={categories} />
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

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <NativeSelect value={value} onChange={(e) => onChange(e.target.value)} className="w-full">
        {children}
      </NativeSelect>
    </label>
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
  categories = [],
}: {
  purchase: PurchaseWithOptions;
  memberMap: MemberMap;
  categories?: string[];
}) {
  const opts = sortedOptions(purchase);
  const members = Object.entries(memberMap).map(([id, name]) => ({ id, name }));
  return (
    <div className={cn("flex min-w-0 items-center gap-3 border-l-4 px-4 py-2.5 text-sm", PRIORITY_ACCENT[purchase.priority])}>
      <PurchaseDetailDialog purchase={purchase} memberMap={memberMap} categories={categories}>
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
          categories={categories}
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
  categories = [],
}: {
  purchase: PurchaseWithOptions;
  memberMap: MemberMap;
  defaultOpen?: boolean;
  categories?: string[];
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const options = sortedOptions(purchase);
  const members = Object.entries(memberMap).map(([id, name]) => ({ id, name }));
  const prices = options.map((o) => Number(o.price));
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const chosen = options.find((o) => o.is_chosen);

  return (
    <Card className={cn("flex min-w-0 max-w-full flex-col overflow-hidden border-l-4", PRIORITY_ACCENT[purchase.priority])}>
      <CardContent className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <PurchaseDetailDialog purchase={purchase} memberMap={memberMap} categories={categories}>
            <CardTrigger className="block min-w-0 flex-1 rounded-md text-left">
              <span className="block min-w-0 whitespace-normal break-words font-medium leading-snug [overflow-wrap:anywhere] hover:underline">
                {purchase.name}
              </span>
              <p className="min-w-0 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
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
            {purchase.notes ? (
              <p className="line-clamp-3 min-w-0 whitespace-pre-wrap break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                {purchase.notes}
              </p>
            ) : null}

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
          </>
        ) : null}

        <div className="mt-auto flex min-w-0 flex-wrap items-center justify-between gap-2 border-t pt-3">
          <AddedBy name={memberMap[purchase.user_id]} />
          <div className="flex items-center gap-2">
            <div className="w-32">
              <StatusSelect purchase={purchase} />
            </div>
            <PurchaseForm
              purchase={purchase}
              members={members}
              categories={categories}
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
