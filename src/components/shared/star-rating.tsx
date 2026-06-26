"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/**
 * An out-of-5 star rating. Read-only by default; pass `onRate` to make it
 * interactive (clicking a star sets that value; clicking the current value
 * clears it back to unrated). Used for purchase items and their options.
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
  const [hover, setHover] = React.useState<number | null>(null);
  const { toast } = useToast();
  const current = value ?? 0;
  const dim = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  function rate(n: number) {
    if (!onRate) return;
    const next = n === current ? 0 : n;
    startTransition(async () => {
      const res = await onRate(next);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't rate", description: res.error });
    });
  }

  const interactive = Boolean(onRate);

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", interactive && "cursor-pointer", className)}
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const lit = (hover ?? current) >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive || pending}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onMouseEnter={interactive ? () => setHover(n) : undefined}
            onClick={interactive ? () => rate(n) : undefined}
            className={cn(
              "transition-colors",
              interactive ? "hover:scale-110" : "cursor-default",
              !interactive && "pointer-events-none",
            )}
          >
            <Star
              className={cn(
                dim,
                lit ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
              )}
            />
          </button>
        );
      })}
    </span>
  );
}
