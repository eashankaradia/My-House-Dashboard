"use client";

import * as React from "react";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type Item = { id: string; label: string };

/**
 * A collapsible "Archived (N)" panel listing archived items with restore and
 * delete actions. Hidden entirely when there's nothing archived.
 */
export function ArchivedSection({
  items,
  noun,
  onRestore,
  onDelete,
}: {
  items: Item[];
  noun: string;
  onRestore: (id: string) => Promise<{ error?: string } | void>;
  onDelete: (id: string) => Promise<{ error?: string } | void>;
}) {
  const [open, setOpen] = React.useState(false);
  if (items.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-0">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <Archive className="h-4 w-4" />
          Archived {noun} ({items.length})
          <span className="ml-auto text-xs">{open ? "Hide" : "Show"}</span>
        </button>
        {open ? (
          <div className="divide-y border-t">
            {items.map((item) => (
              <Row key={item.id} item={item} onRestore={onRestore} onDelete={onDelete} />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Row({
  item,
  onRestore,
  onDelete,
}: {
  item: Item;
  onRestore: (id: string) => Promise<{ error?: string } | void>;
  onDelete: (id: string) => Promise<{ error?: string } | void>;
}) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function run(fn: (id: string) => Promise<{ error?: string } | void>) {
    startTransition(async () => {
      const res = await fn(item.id);
      if (res && "error" in res && res.error) {
        toast({ variant: "destructive", title: "Something went wrong", description: res.error });
      }
    });
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 text-sm">
      <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.label}</span>
      <button
        onClick={() => run(onRestore)}
        disabled={pending}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Restore
      </button>
      <button
        onClick={() => run(onDelete)}
        disabled={pending}
        className="rounded-md p-1.5 text-muted-foreground hover:text-destructive"
        aria-label="Delete permanently"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
