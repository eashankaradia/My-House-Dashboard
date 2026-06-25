"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { toggleStar } from "./actions";

/**
 * Favourite star for a purchase. Filled when the current user has starred it;
 * the title lists everyone in the household who has. Lives outside the card's
 * clickable area so it doesn't open the detail.
 */
export function StarButton({
  purchaseId,
  mine,
  names,
}: {
  purchaseId: string;
  mine: boolean;
  names: string[];
}) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const label = names.length ? `Starred by ${names.join(", ")}` : "Star as a favourite";

  return (
    <button
      type="button"
      disabled={pending}
      title={label}
      aria-label={label}
      aria-pressed={mine}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleStar(purchaseId);
          if (res?.error) toast({ variant: "destructive", title: "Couldn't update", description: res.error });
        })
      }
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium transition-colors",
        mine ? "text-amber-500" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Star className={cn("h-4 w-4", mine && "fill-amber-400")} />
      {names.length ? <span>{names.length}</span> : null}
    </button>
  );
}
