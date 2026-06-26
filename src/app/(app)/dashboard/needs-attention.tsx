import Link from "next/link";
import { AlertTriangle, ChevronRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type AttentionItem = {
  label: string;
  sub: string;
  href: string;
  severity: "overdue" | "soon";
};

/**
 * The action-driving strip at the very top of the dashboard: overdue and
 * due-now items, each one tap from being dealt with. Calm "all caught up"
 * state when there's nothing pressing.
 */
export function NeedsAttention({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="flex items-center gap-2.5 p-3.5 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">You&apos;re all caught up.</span>
          <span className="text-muted-foreground">Nothing overdue or due today.</span>
        </CardContent>
      </Card>
    );
  }

  const shown = items.slice(0, 6);
  const overdue = items.filter((i) => i.severity === "overdue").length;

  return (
    <Card className="overflow-hidden border-amber-500/30">
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-2 border-b bg-amber-500/10 px-4 py-2.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Needs attention
          </span>
          <span className="text-xs text-muted-foreground">
            {items.length} item{items.length === 1 ? "" : "s"}{overdue ? ` · ${overdue} overdue` : ""}
          </span>
        </div>
        <div className="divide-y">
          {shown.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent active:bg-accent"
            >
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  item.severity === "overdue" ? "bg-rose-500" : "bg-amber-500",
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.label}</span>
                <span
                  className={cn(
                    "text-xs",
                    item.severity === "overdue" ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground",
                  )}
                >
                  {item.sub}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
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
