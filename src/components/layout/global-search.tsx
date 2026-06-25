"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { searchItems, type SearchResult } from "@/app/(app)/search/actions";

/** Top-bar search: opens a dialog that searches across all items by name. */
export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      startTransition(async () => setResults(await searchItems(q)));
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  // Reset when closing.
  React.useEffect(() => {
    if (!open) {
      setQ("");
      setResults([]);
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Search className="h-5 w-5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search bills, projects, tasks, purchases…"
          />
          <div className="max-h-[50vh] space-y-1 overflow-y-auto">
            {q.trim().length < 2 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Type at least two letters.</p>
            ) : pending && results.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Searching…</p>
            ) : results.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No matches.</p>
            ) : (
              results.map((r) => (
                <Link
                  key={`${r.type}-${r.id}`}
                  href={r.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <span className="min-w-0 truncate">{r.label}</span>
                  <Badge variant="secondary" className="shrink-0">{r.type}</Badge>
                </Link>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
