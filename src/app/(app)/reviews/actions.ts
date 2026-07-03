"use server";

import { revalidatePath } from "next/cache";
import { getActionContext, type ActionResult } from "@/lib/action-utils";
import type { ReviewPeriod } from "@/lib/database.types";

export async function upsertReview(
  periodType: ReviewPeriod,
  periodStart: string,
  input: { went_well?: string; stuck?: string; stop_doing?: string; priorities?: string },
): Promise<ActionResult> {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase
    .from("reviews")
    .upsert(
      {
        user_id: user.id,
        period_type: periodType,
        period_start: periodStart,
        went_well: input.went_well?.trim() || null,
        stuck: input.stuck?.trim() || null,
        stop_doing: input.stop_doing?.trim() || null,
        priorities: input.priorities?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,period_type,period_start" },
    );
  if (error) return { error: error.message };
  revalidatePath("/reviews");
  return {};
}
