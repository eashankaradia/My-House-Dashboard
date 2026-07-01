"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { setPaymentPaid } from "@/app/(app)/bills/actions";
import { toggleTask } from "@/app/(app)/projects/actions";
import { completeMaintenance } from "@/app/(app)/maintenance/actions";

export type AttentionKind = "bill_payment" | "task" | "maintenance";

export type AttentionItem = {
  /** The row's own id — the bill_payment/task/maintenance_task row, not its parent. */
  id?: string;
  /** Which server action completes this item. Omitted for items with no in-place action (e.g. document expiry). */
  kind?: AttentionKind;
  label: string;
  sub: string;
  href: string;
  severity: "overdue" | "soon";
};

const COMPLETE_ACTION: Record<AttentionKind, (id: string) => Promise<{ error?: string } | void>> = {
  bill_payment: (id) => setPaymentPaid(id, true),
  task: (id) => toggleTask(id, true),
  maintenance: (id) => completeMaintenance(id),
};

/**
 * "Today" — the action-driving strip at the very top of the dashboard: overdue
 * and due-now items, completable in place with one tap instead of navigating
 * away. Calm "all caught up" state when there's nothing pressing, and the same
 * state is the reward you land on once you clear the list.
 */
export function NeedsAttention({ items }: { items: AttentionItem[] }) {
  const [done, setDone] = React.useState<Set<string>>(new Set());
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const remaining = items.filter((item) => !item.id || !done.has(item.id));

  function complete(item: AttentionItem) {
    if (!item.id || !item.kind) return;
    const id = item.id;
    setDone((prev) => new Set(prev).add(id));
    startTransition(async () => {
      const result = await COMPLETE_ACTION[item.kind!](id);
      if (result?.error) {
        setDone((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast({ title: result.error, variant: "destructive" });
      }
    });
  }

  if (remaining.length === 0) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="flex items-center gap-2.5 p-3.5 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="truncate font-medium">
            {items.length > 0 ? "All caught up — nice work! 🎉" : "All caught up — nothing due."}
          </span>
        </CardContent>
      </Card>
    );
  }

  const shown = items.slice(0, 6);
  const overdue = remaining.filter((i) => i.severity === "overdue").length;

  return (
    <Card className="overflow-hidden border-amber-500/30">
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-2 border-b bg-amber-500/10 px-4 py-2.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Today
          </span>
          <span className="text-xs text-muted-foreground">
            {remaining.length} item{remaining.length === 1 ? "" : "s"}{overdue ? ` · ${overdue} overdue` : ""}
          </span>
        </div>
        <div className="divide-y">
          {shown.map((item, i) => {
            const isDone = Boolean(item.id && done.has(item.id));
            const canComplete = Boolean(item.id && item.kind);
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 transition-colors",
                  isDone && "bg-emerald-500/5",
                )}
              >
                {canComplete ? (
                  <button
                    type="button"
                    onClick={() => complete(item)}
                    disabled={pending && isDone}
                    aria-label={isDone ? "Completed" : "Mark done"}
                    className="shrink-0 active:scale-90 transition-transform"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                ) : (
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      item.severity === "overdue" ? "bg-rose-500" : "bg-amber-500",
                    )}
                  />
                )}
                <Link href={item.href} className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80">
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-sm font-medium", isDone && "text-muted-foreground line-through")}>
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        isDone
                          ? "text-emerald-600 dark:text-emerald-400"
                          : item.severity === "overdue"
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-muted-foreground",
                      )}
                    >
                      {isDone ? "Done" : item.sub}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </div>
            );
          })}
        </div>
        {items.length > shown.length ? (
          <p className="px-4 py-2 text-center text-xs text-muted-foreground">
            +{items.length - shown.length} more
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
