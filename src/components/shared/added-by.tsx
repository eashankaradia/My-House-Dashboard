import { User } from "lucide-react";

/** Tiny "Added by …" attribution label. Renders nothing if the name is unknown. */
export function AddedBy({ name, className }: { name?: string | null; className?: string }) {
  if (!name) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] text-muted-foreground ${className ?? ""}`}>
      <User className="h-3 w-3" />
      {name}
    </span>
  );
}
