"use client";

import * as React from "react";
import { Check, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { AddedBy } from "@/components/shared/added-by";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { MemberMap } from "@/lib/household";
import type { ShoppingItem } from "@/lib/database.types";
import { addShoppingItem, clearGotItems, deleteShoppingItem, setShoppingItemGot } from "./actions";

export function ShoppingList({
  items,
  memberMap,
}: {
  items: ShoppingItem[];
  memberMap: MemberMap;
}) {
  const [name, setName] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  // Outstanding items first (newest first), then got items (most recent got).
  const needed = items
    .filter((i) => !i.is_got)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const got = items
    .filter((i) => i.is_got)
    .sort((a, b) => (b.got_at ?? "").localeCompare(a.got_at ?? ""));

  function run(fn: () => Promise<{ error?: string } | void>, after?: () => void) {
    startTransition(async () => {
      const res = await fn();
      if (res?.error) {
        toast({ variant: "destructive", title: "Something went wrong", description: res.error });
        return;
      }
      after?.();
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    run(
      () => addShoppingItem({ name, quantity }),
      () => {
        setName("");
        setQuantity("");
      },
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-3">
          <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Add an item…"
              className="h-10 min-w-[160px] flex-1"
            />
            <Input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Qty (e.g. 2, 1kg)"
              className="h-10 w-32"
            />
            <Button type="submit" disabled={pending || !name.trim()} className="h-10 gap-1.5">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your list is empty"
          description="Add the things you need to pick up — everyone in the household sees the same list."
        />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {needed.map((item) => (
              <Row key={item.id} item={item} memberMap={memberMap} disabled={pending} onToggle={run} onDelete={run} />
            ))}
            {got.length > 0 ? (
              <div className="flex items-center justify-between gap-2 bg-muted/30 px-4 py-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Got it ({got.length})
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => clearGotItems())}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Clear got
                </button>
              </div>
            ) : null}
            {got.map((item) => (
              <Row key={item.id} item={item} memberMap={memberMap} disabled={pending} onToggle={run} onDelete={run} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({
  item,
  memberMap,
  disabled,
  onToggle,
  onDelete,
}: {
  item: ShoppingItem;
  memberMap: MemberMap;
  disabled: boolean;
  onToggle: (fn: () => Promise<{ error?: string } | void>) => void;
  onDelete: (fn: () => Promise<{ error?: string } | void>) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 text-sm">
      <button
        type="button"
        disabled={disabled}
        aria-label={item.is_got ? "Mark as still needed" : "Got it"}
        aria-pressed={item.is_got}
        onClick={() => onToggle(() => setShoppingItemGot(item.id, !item.is_got))}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
          item.is_got ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/40 hover:border-foreground",
        )}
      >
        {item.is_got ? <Check className="h-4 w-4" /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("truncate font-medium", item.is_got && "text-muted-foreground line-through")}>
            {item.name}
          </span>
          {item.quantity ? (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{item.quantity}</span>
          ) : null}
        </div>
        <AddedBy name={memberMap[item.user_id]} />
      </div>
      <button
        type="button"
        disabled={disabled}
        aria-label="Delete item"
        onClick={() => onDelete(() => deleteShoppingItem(item.id))}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
