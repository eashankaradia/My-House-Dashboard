"use client";

import { User } from "lucide-react";
import { useMemberColorClass } from "@/components/providers/household-colors";

/** Tiny "Added by …" attribution label. Renders nothing if the name is unknown. */
export function AddedBy({ name, className }: { name?: string | null; className?: string }) {
  const colorClass = useMemberColorClass(name);
  if (!name) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] text-muted-foreground ${className ?? ""}`}>
      <User className="h-3 w-3" />
      <span className={colorClass || undefined}>{name}</span>
    </span>
  );
}
