"use client";

import { Film, BookOpen } from "lucide-react";
import type { FinanceInspiration } from "@/lib/database.types";
import { FinanceInspirationForm } from "./finance-inspiration-form";

export function FinanceInspirationList({ items }: { items: FinanceInspiration[] }) {
  if (items.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <FinanceInspirationForm
          key={item.id}
          item={item}
          trigger={
            <button className="overflow-hidden rounded-xl border bg-card text-left transition-all active:scale-[0.99]">
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_url} alt={item.title} className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted">
                  {item.kind === "reel" ? (
                    <Film className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
              )}
              <div className="space-y-1 p-3">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.kind === "reel" ? "Reel" : "Guide"}
                  {item.source ? ` · ${item.source}` : ""}
                </p>
              </div>
            </button>
          }
        />
      ))}
    </div>
  );
}
