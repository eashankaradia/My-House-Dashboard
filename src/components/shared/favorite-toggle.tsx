"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFavorite, type FavoriteType } from "@/app/(app)/favorites/actions";
import { useToast } from "@/hooks/use-toast";

/** A star button that pins/unpins (entityType, entityId) for the current user. Optimistic. */
export function FavoriteToggle({
  entityType,
  entityId,
  initialFavorited,
  className,
}: {
  entityType: FavoriteType;
  entityId: string;
  initialFavorited: boolean;
  className?: string;
}) {
  const [favorited, setFavorited] = React.useState(initialFavorited);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !favorited;
    setFavorited(next);
    startTransition(async () => {
      const res = await toggleFavorite(entityType, entityId);
      if (res?.error) {
        setFavorited(!next);
        toast({ variant: "destructive", title: "Couldn't update pin", description: res.error });
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={favorited ? "Unpin" : "Pin"}
      aria-pressed={favorited}
      className={cn("shrink-0 text-muted-foreground transition-colors hover:text-foreground", favorited && "text-amber-500 hover:text-amber-500", className)}
    >
      <Star className={cn("h-4 w-4", favorited && "fill-current")} />
    </button>
  );
}
