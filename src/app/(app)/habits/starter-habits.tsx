"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { createHabit } from "./actions";

const STARTER_HABITS: { name: string; tags?: string[] }[] = [
  { name: "Drink water", tags: ["Morning"] },
  { name: "Move for 10 minutes" },
  { name: "Read" },
  { name: "Stretch" },
  { name: "Plan tomorrow", tags: ["Evening"] },
  { name: "No phone before bed", tags: ["Evening"] },
];

/**
 * One-tap starter habits for the empty state — suggest, don't make the
 * first-ever habit require filling out a form. Each tap creates a daily
 * yes/no habit directly; the empty state clears itself once habits exist
 * (the page re-fetches after createHabit's revalidatePath).
 */
export function StarterHabits() {
  const [added, setAdded] = React.useState<Set<string>>(new Set());
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function add(starter: (typeof STARTER_HABITS)[number]) {
    setAdded((prev) => new Set(prev).add(starter.name));
    startTransition(async () => {
      const result = await createHabit({
        name: starter.name,
        frequency: "daily",
        habit_type: "yes_no",
        tags: starter.tags ?? [],
      });
      if (result?.error) {
        setAdded((prev) => {
          const next = new Set(prev);
          next.delete(starter.name);
          return next;
        });
        toast({ variant: "destructive", title: "Couldn't add", description: result.error });
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Or start with one of these</p>
      <div className="flex flex-wrap justify-center gap-2">
        {STARTER_HABITS.map((starter) => {
          const isAdded = added.has(starter.name);
          return (
            <button
              key={starter.name}
              type="button"
              disabled={isAdded || pending}
              onClick={() => add(starter)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                isAdded ? "border-primary/30 text-primary" : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {isAdded ? "Added" : <Plus className="h-3.5 w-3.5" />}
              {starter.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
