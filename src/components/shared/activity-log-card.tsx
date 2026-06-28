"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ActivityLogCard({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          <History className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="font-medium">{title}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{count}</span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open ? <CardContent className="divide-y p-0">{children}</CardContent> : null}
    </Card>
  );
}
