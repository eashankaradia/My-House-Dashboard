"use client";

import * as React from "react";
import { Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/**
 * An out-of-5 star rating. Read-only by default; pass `onRate` to make it
 * interactive. Tapping a star sets that value and it sticks (no clear-on-tap);
 * a small × clears it. Used for purchase options.
 */
export function StarRating({
  value,
  onRate,
  size = "md",
  className,
}: {
  value: number | null | undefined;
  onRate?: (rating: number) => Promise<{ error?: string } | void>;
  size?: "sm" | "md";
  className?: string;
}) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const current = value ?? 0;
  const dim = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const interactive = Boolean(onRate);

  function rate(n: number) {
    if (!onRate || pending) return;
    startTransition(async () => {
      const res = await onRate(n);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't rate", description: res.error });
    });
  }

  return (
    <span className={cn("inline-flex items-center", interactive ? "gap-0.5" : "gap-px", className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const lit = current >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive || pending}
            aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
            aria-pressed={current === n}
            onClick={interactive ? () => rate(n) : undefined}
            className={cn(
              interactive ? "rounded p-1 active:scale-95" : "pointer-events-none",
            )}
          >
            <Star className={cn(dim, lit ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
          </button>
        );
      })}
      {interactive && current > 0 ? (
        <button
          type="button"
          disabled={pending}
          aria-label="Clear rating"
          onClick={() => rate(0)}
          className="ml-0.5 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </span>
  );
}
