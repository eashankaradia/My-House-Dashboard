import { SunMoon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { RoutineItem } from "@/lib/database.types";
import { RoutineView } from "./routine-view";
import { RoutineItemForm } from "./routine-item-form";

export const metadata = { title: "Routine" };

export default async function RoutinePage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [itemsRes, completionsRes] = await Promise.all([
    supabase.from("routine_items").select("*").order("section", { ascending: true }).order("order_index", { ascending: true }),
    supabase.from("routine_completions").select("item_id").eq("completed_date", today),
  ]);

  const items = (itemsRes.data ?? []) as RoutineItem[];
  const completedIds = (completionsRes.data ?? []).map((c) => c.item_id as string);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Routine"
        description="Your daily routine, step by step."
        info="Check off each step as you go. It resets automatically every day."
      >
        <RoutineItemForm />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          icon={SunMoon}
          title="No routine yet"
          description="Add the steps of your daily routine — what to consume, and what to do for your mind and body. Morning/day/evening habits live in Habits, tagged by time of day."
        >
          <RoutineItemForm />
        </EmptyState>
      ) : (
        <RoutineView items={items} completedIds={completedIds} today={today} />
      )}
    </div>
  );
}
