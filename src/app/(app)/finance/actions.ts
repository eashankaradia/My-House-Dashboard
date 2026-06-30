"use server";

import { getActionContext } from "@/lib/action-utils";
import { revalidatePath } from "next/cache";

export async function upsertFinanceSettings(input: {
  monthlyIncome?: number | null;
  incomeLabel?: string;
}) {
  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("finance_settings").upsert(
    {
      user_id: user.id,
      monthly_income: input.monthlyIncome ?? null,
      income_label: input.incomeLabel || "Monthly income",
    },
    { onConflict: "user_id" },
  );
  if (error) return { error: error.message };
  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

