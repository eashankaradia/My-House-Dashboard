"use client";

import * as React from "react";
import { ChevronDown, DoorOpen, Filter, Pencil, Rows3, ShoppingBag, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { AddedBy } from "@/components/shared/added-by";
import { CardTrigger } from "@/components/shared/card-trigger";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { SearchInput } from "@/components/shared/search-input";
import { useToast } from "@/hooks/use-toast";
import { useViewPref } from "@/hooks/use-view-prefs";
import { useRooms } from "@/hooks/use-rooms";
import { ITEM_SCOPE_LABELS, PURCHASE_SIZES, PURCHASE_STATUSES } from "@/lib/constants";
import { PRIORITY_ACCENT } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { Money } from "@/components/shared/money";
import type { MemberMap } from "@/lib/household";
import type { PurchaseOption, PurchaseWithOptions } from "@/lib/database.types";
import { PurchaseForm } from "./purchase-form";
import { PurchaseDetailDialog } from "./purchase-detail";
import { StatusSelect } from "./status-select";
import { deletePurchase } from "./actions";

const SORTS = {
  rating: "Rating (high → low)",
  priority: "Priority",
  price: "Price (high → low)",
  room: "Room",
  category: "Category",
} as const;

// Purchased items live in their own collapsed section, not the status filter.
const ACTIVE_STATUSES = PURCHASE_STATUSES.filter((s) => s !== "Purchased");

// Bucket in the Rooms view for items nobody has assigned a room to yet.
const NO_ROOM = "No room yet";

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
  const roomList = useRooms();
  // Only two views now; anything else is a stored pref from the old
  // four-view toggle, so treat it as the flat list.
  const effectiveView = view === "rooms" ? "rooms" : "compact";
  const isLife = process.env.NEXT_PUBLIC_APP === "life";
  const [onlyMine, setOnlyMine] = React.useState(false);
  const [scopeFilter, setScopeFilter] = React.useState<"all" | "personal" | "household">("all");
  const [hideNoOptions, setHideNoOptions] = React.useState(false);
  const [essentialOnly, setEssentialOnly] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const rooms = Array.from(new Set(purchases.map((p) => p.room).filter(Boolean))) as string[];
  const rank = { High: 0, Medium: 1, Low: 2 } as const;
  const activeFilters = [
    hideNoOptions ? { label: "Has options", clear: () => setHideNoOptions(false) } : null,
    essentialOnly ? { label: "Essential only", clear: () => setEssentialOnly(false) } : null,
    onlyMine ? { label: "Added by me", clear: () => setOnlyMine(false) } : null,
    scopeFilter !== "all" ? { label: ITEM_SCOPE_LABELS[scopeFilter], clear: () => setScopeFilter("all") } : null,
    status !== "All" ? { label: status, clear: () => setStatus("All") } : null,
    room !== "All" ? { label: room, clear: () => setRoom("All") } : null,
    category !== "All" ? { label: category, clear: () => setCategory("All") } : null,
    size !== "All" ? { label: `${size} purchases`, clear: () => setSize("All") } : null,
    minRating > 0 ? { label: `${minRating}+ stars`, clear: () => setMinRating(0) } : null,
  ].filter((filter): filter is { label: string; clear: () => void } => Boolean(filter));

  // Purchased items move to a collapsed section below — they're done, not
  // something to keep browsing/filtering alongside the active wishlist.
  const purchased = purchases
    .filter((p) => p.status === "Purchased")
    .filter((p) => (!search.trim() ? true : p.name.toLowerCase().includes(search.trim().toLowerCase())))
    .sort((a, b) => (b.purchased_at ?? b.created_at).localeCompare(a.purchased_at ?? a.created_at));

  const filtered = purchases
    .filter((p) => p.status !== "Purchased")
    .filter((p) => (!search.trim() ? true : p.name.toLowerCase().includes(search.trim().toLowerCase())))
    .filter((p) => (!onlyMine ? true : p.user_id === currentUserId))
    .filter((p) => (scopeFilter === "all" ? true : p.scope === scopeFilter))
    .filter((p) => (!hideNoOptions ? true : p.options.length > 0))
    .filter((p) => (!essentialOnly ? true : p.is_essential))
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

  // Once a search or filter is narrowing things down, showing empty rooms is
  // just noise — and matching sections should already be open.
  const narrowing = Boolean(search.trim()) || activeFilters.length > 0;

  // Rooms view: one collapsible section per room in the household, so the
  // wishlist reads as "what's planned for each room".
  const roomNames = Array.from(
    new Set([...roomList, ...(purchases.map((p) => p.room).filter(Boolean) as string[])]),
  ).sort((a, b) => a.localeCompare(b));
  const unassigned = filtered.filter((p) => !p.room);
  const allRoomGroups = [
    ...roomNames.map((name) => ({ name, items: filtered.filter((p) => p.room === name) })),
    ...(unassigned.length ? [{ name: NO_ROOM, items: unassigned }] : []),
  ];
  // Only rooms with something in them get a section. The household has far
  // more rooms configured than it has wishlist items, so giving every room a
  // section buries the real content under empty ones; the leftovers get a
  // single muted line instead.
  const roomGroups = allRoomGroups.filter((group) => group.items.length > 0);
  const emptyRooms = allRoomGroups.filter((group) => group.items.length === 0).map((group) => group.name);

  return (
    <div className="space-y-4">
      <SearchInput value={search} onChange={setSearch} placeholder="Search purchases…" className="max-w-sm" />
      <div className="flex flex-wrap items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 rounded-full border bg-background px-3 shadow-sm">
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
              <FilterGroup label="Added by">
                <SegmentedButton active={!onlyMine} onClick={() => setOnlyMine(false)}>Everyone</SegmentedButton>
                <SegmentedButton active={onlyMine} onClick={() => setOnlyMine(true)}>Me</SegmentedButton>
              </FilterGroup>
              {isLife ? (
                <FilterGroup label="Scope">
                  {(["all", "household", "personal"] as const).map((s) => (
                    <SegmentedButton key={s} active={scopeFilter === s} onClick={() => setScopeFilter(s)}>
                      {s === "all" ? "All" : ITEM_SCOPE_LABELS[s]}
                    </SegmentedButton>
                  ))}
                </FilterGroup>
              ) : null}
              <FilterSelect label="Status" value={status} onChange={setStatus}>
                <option value="All">All statuses</option>
                {ACTIVE_STATUSES.map((s) => (
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
              <button
                type="button"
                onClick={() => setEssentialOnly((v) => !v)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  essentialOnly && "bg-accent text-foreground",
                )}
              >
                Essential only
              </button>
            </div>
          </SheetContent>
        </Sheet>
        {activeFilters.map((filter) => (
          <button
            key={filter.label}
            type="button"
            onClick={filter.clear}
            className="inline-flex max-w-[10rem] items-center gap-1 rounded-full border bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <span className="truncate">{filter.label}</span>
            <X className="h-3 w-3" />
          </button>
        ))}
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
              onClick={() => setView("rooms")}
              aria-label="By room"
              className={cn("rounded-md p-1.5 text-muted-foreground", view === "rooms" && "bg-accent text-foreground")}
            >
              <DoorOpen className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("compact")}
              aria-label="Flat list"
              className={cn("rounded-md p-1.5 text-muted-foreground", view === "compact" && "bg-accent text-foreground")}
            >
              <Rows3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 && purchased.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Nothing here" description="No items match this filter yet." />
      ) : (
        <>
          {filtered.length === 0 ? null : effectiveView === "rooms" ? (
            <div className="space-y-2">
              {roomGroups.map((group, i) => (
                <RoomSection
                  // Remounts when a filter starts/stops narrowing, so the
                  // sections that matter are open without extra clicks.
                  key={`${group.name}|${narrowing}`}
                  room={group.name}
                  items={group.items}
                  memberMap={memberMap}
                  categories={categories}
                  defaultOpen={narrowing || i === 0}
                />
              ))}
              {emptyRooms.length > 0 && !narrowing ? (
                <p className="px-1 pt-1 text-xs text-muted-foreground">
                  Nothing planned yet in {emptyRooms.join(", ")}.
                </p>
              ) : null}
            </div>
          ) : (
            <Card>
              <CardContent className="divide-y p-0">
                {filtered.map((purchase) => (
                  <CompactRow key={purchase.id} purchase={purchase} memberMap={memberMap} categories={categories} />
                ))}
              </CardContent>
            </Card>
          )}

          <CollapsibleSection title="Purchased" count={purchased.length}>
            <div className="space-y-2">
              {purchased.map((purchase) => (
                <CompactRow key={purchase.id} purchase={purchase} memberMap={memberMap} categories={categories} />
              ))}
            </div>
          </CollapsibleSection>
        </>
      )}
    </div>
  );
}

function RoomSection({
  room,
  items,
  memberMap,
  categories,
  defaultOpen,
}: {
  room: string;
  items: PurchaseWithOptions[];
  memberMap: MemberMap;
  categories: string[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const total = items.reduce((sum, p) => sum + effectivePrice(p), 0);

  return (
    <Card>
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-4 py-3 text-left"
        >
          <span className="min-w-0 flex-1 truncate font-medium">{room}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {items.length} item{items.length === 1 ? "" : "s"}
          </span>
          <span className="shrink-0 text-sm font-semibold">
            <Money value={total} />
          </span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </button>
        {open ? (
          <div className="divide-y border-t">
            {items.map((purchase) => (
              <SimpleRow key={purchase.id} purchase={purchase} memberMap={memberMap} categories={categories} />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * The plainest useful row: name, what it is, and what it'll cost. Tapping
 * anywhere opens the item, where status/edit/options/delete all live — so the
 * list itself stays readable instead of being a wall of controls.
 */
function SimpleRow({
  purchase,
  memberMap,
  categories,
}: {
  purchase: PurchaseWithOptions;
  memberMap: MemberMap;
  categories: string[];
}) {
  const count = purchase.options.length;
  const meta = [purchase.category, count ? `${count} option${count === 1 ? "" : "s"}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <PurchaseDetailDialog purchase={purchase} memberMap={memberMap} categories={categories}>
      <CardTrigger
        className={cn(
          "flex min-w-0 items-center gap-3 border-l-4 px-4 py-3 text-sm hover:bg-accent/40",
          PRIORITY_ACCENT[purchase.priority],
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{purchase.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{meta}</span>
        </span>
        {!purchase.is_essential ? (
          <span className="shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            Nice-to-have
          </span>
        ) : null}
        <span className="shrink-0 font-semibold">
          <Money value={effectivePrice(purchase)} />
        </span>
      </CardTrigger>
    </PurchaseDetailDialog>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center rounded-lg border p-0.5 text-sm">{children}</div>
    </div>
  );
}

function SegmentedButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={cn("flex-1 rounded-md px-2.5 py-1", active && "bg-accent")}>
      {children}
    </button>
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
            {process.env.NEXT_PUBLIC_APP === "life" && purchase.scope === "personal" ? (
              <span className="shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground">Personal</span>
            ) : null}
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
      <span className="shrink-0 font-semibold"><Money value={effectivePrice(purchase)} /></span>
      <div className="hidden w-32 shrink-0 sm:block">
        <StatusSelect purchase={purchase} />
      </div>
      <div className="flex shrink-0 items-center">
        <PurchaseForm
          purchase={purchase}
          members={members}
          categories={categories}
          trigger={
            <button aria-label="Edit item" className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
              <Pencil className="h-4 w-4" />
            </button>
          }
        />
        <ConfirmDelete itemLabel="item" action={deletePurchase.bind(null, purchase.id)} />
      </div>
    </div>
  );
}

