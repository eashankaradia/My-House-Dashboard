"use client";

import * as React from "react";
import { CheckCircle2, Circle, Pencil } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ROUTINE_GROUPS, ROUTINE_SECTION_LABELS } from "@/lib/constants";
import type { RoutineItem } from "@/lib/database.types";
import { toggleRoutineItem } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { RoutineItemForm } from "./routine-item-form";

export function RoutineView({ items, completedIds, today }: { items: RoutineItem[]; completedIds: string[]; today: string }) {
  const [optimisticDone, setOptimisticDone] = React.useState<Set<string>>(new Set(completedIds));
  const [, startTransition] = React.useTransition();
  const { toast } = useToast();

  const total = items.length;
  const done = items.filter((i) => optimisticDone.has(i.id)).length;

  function toggle(item: RoutineItem) {
    const isDone = optimisticDone.has(item.id);
    const next = new Set(optimisticDone);
    if (isDone) next.delete(item.id);
    else next.add(item.id);
    setOptimisticDone(next);
    startTransition(async () => {
      const result = await toggleRoutineItem(item.id, today);
      if (result?.error) {
        const revert = new Set(optimisticDone);
        setOptimisticDone(revert);
        toast({ title: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-1.5 flex items-baseline justify-between">
          <p className="text-sm font-medium">Today</p>
          <p className="text-sm text-muted-foreground">
            {done}/{total}
          </p>
        </div>
        <Progress value={total > 0 ? (done / total) * 100 : 0} />
      </div>

      {ROUTINE_GROUPS.map((group) => {
        const groupItems = items.filter((i) => (group.sections as readonly string[]).includes(i.section));
        if (groupItems.length === 0) return null;
        return (
          <section key={group.title} className="space-y-3">
            <h2 className="px-1 text-sm font-semibold">{group.title}</h2>
            {group.sections.map((section) => {
              const sectionItems = items.filter((i) => i.section === section);
              if (sectionItems.length === 0) return null;
              return (
                <div key={section} className="space-y-1.5">
                  {group.sections.length > 1 && (
                    <p className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {ROUTINE_SECTION_LABELS[section]}
                    </p>
                  )}
                  {sectionItems.map((item) => {
                    const isDone = optimisticDone.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-all",
                          isDone && "border-primary/20 bg-primary/5",
                        )}
                      >
                        <button onClick={() => toggle(item)} className="shrink-0 active:scale-90 transition-transform">
                          {isDone ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                        </button>
                        <button onClick={() => toggle(item)} className="min-w-0 flex-1 text-left">
                          <p className={cn("text-sm", isDone && "text-muted-foreground line-through")}>{item.name}</p>
                        </button>
                        <RoutineItemForm
                          item={item}
                          trigger={
                            <button className="shrink-0 text-muted-foreground">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
