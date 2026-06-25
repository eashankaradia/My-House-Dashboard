import { formatDate } from "@/lib/utils";

export function ItemTimestamps({
  createdAt,
  updatedAt,
}: {
  createdAt: string;
  updatedAt: string;
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span>Created {formatDate(createdAt)}</span>
      <span>Last updated {formatDate(updatedAt)}</span>
    </div>
  );
}
