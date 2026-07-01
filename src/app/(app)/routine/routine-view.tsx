"use client";

import * as React from "react";
import { Brain, CheckCircle2, Circle, Dumbbell, Pencil, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ROUTINE_SECTIONS, ROUTINE_SECTION_LABELS } from "@/lib/constants";
import type { RoutineItem } from "@/lib/database.types";
import { toggleRoutineItem } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { RoutineItemForm } from "./routine-item-form";

const SECTION_ICONS: Record<string, LucideIcon> = {
  consume: Utensils,
  mind: Brain,
  body: Dumbbell,
};

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

  function sectionItems(section: string) {
    return items.filter((i) => i.section === section);
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

      {ROUTINE_SECTIONS.map((section) => {
        const secItems = sectionItems(section);
        if (secItems.length === 0) return null;
        return (
          <SectionCard
            key={section}
            section={section}
            items={secItems}
            optimisticDone={optimisticDone}
            onToggle={toggle}
            defaultOpen
          />
        );
      })}
    </div>
  );
}

function SectionCard({
  section,
  items,
  optimisticDone,
  onToggle,
  defaultOpen,
}: {
  section: string;
  items: RoutineItem[];
  optimisticDone: Set<string>;
  onToggle: (item: RoutineItem) => void;
  defaultOpen: boolean;
}) {
  const Icon = SECTION_ICONS[section];
  const done = items.filter((i) => optimisticDone.has(i.id)).length;
  const allDone = done === items.length;

  return (
    <details className="group rounded-xl border bg-card" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3">
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
        <span className="flex-1 text-sm font-semibold">{ROUTINE_SECTION_LABELS[section]}</span>
        <span className={cn("shrink-0 text-xs", allDone ? "text-primary" : "text-muted-foreground")}>
          {done}/{items.length}
        </span>
      </summary>
      <div className="space-y-1.5 px-4 pb-4">
        {items.map((item) => {
          const isDone = optimisticDone.has(item.id);
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-all",
                isDone && "border-primary/20 bg-primary/5",
              )}
            >
              <button onClick={() => onToggle(item)} className="shrink-0 active:scale-90 transition-transform">
                {isDone ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
              </button>
              <button onClick={() => onToggle(item)} className="min-w-0 flex-1 text-left">
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
    </details>
  );
}
