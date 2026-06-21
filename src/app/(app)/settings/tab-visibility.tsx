"use client";

import { Eye, EyeOff } from "lucide-react";
import { ALWAYS_VISIBLE, NAV_ITEMS } from "@/lib/constants";
import { useHiddenTabs } from "@/hooks/use-hidden-tabs";
import { cn } from "@/lib/utils";

export function TabVisibilitySettings() {
  const { hidden, toggle } = useHiddenTabs();

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {NAV_ITEMS.map((item) => {
        const locked = ALWAYS_VISIBLE.includes(item.href as (typeof ALWAYS_VISIBLE)[number]);
        const isHidden = hidden.includes(item.href);
        const Icon = item.icon;
        return (
          <button
            key={item.href}
            type="button"
            disabled={locked}
            onClick={() => toggle(item.href)}
            className={cn(
              "flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors",
              locked
                ? "cursor-not-allowed opacity-60"
                : isHidden
                  ? "border-dashed text-muted-foreground hover:bg-accent"
                  : "hover:bg-accent",
            )}
          >
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {item.title}
            </span>
            {locked ? (
              <span className="text-xs text-muted-foreground">Always on</span>
            ) : isHidden ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4 text-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
