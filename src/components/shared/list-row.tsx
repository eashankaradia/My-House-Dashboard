import * as React from "react";
import { cn } from "@/lib/utils";

type ListRowProps = {
  icon?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function ListRow({ icon, title, meta, badges, actions, className }: ListRowProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-sm",
        className,
      )}
    >
      {icon ? <div className="shrink-0">{icon}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 truncate font-medium">{title}</div>
          {badges ? <div className="hidden shrink-0 items-center gap-1 sm:flex">{badges}</div> : null}
        </div>
        {meta ? <div className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</div> : null}
      </div>
      {badges ? <div className="flex shrink-0 items-center gap-1 sm:hidden">{badges}</div> : null}
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </div>
  );
}
