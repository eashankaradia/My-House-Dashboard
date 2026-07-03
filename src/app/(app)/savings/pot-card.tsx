"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { CardTrigger } from "@/components/shared/card-trigger";
import { formatCurrency } from "@/lib/utils";
import type { SavingsAccount, SavingsContribution, SavingsPot } from "@/lib/database.types";
import { PotForm } from "./pot-form";
import { PotDetailDialog } from "./pot-detail";
import { QuickContribute } from "./quick-contribute";
import { deletePot } from "./actions";

const COLOR_BG: Record<string, string> = {
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  teal: "bg-teal-500",
  indigo: "bg-indigo-500",
  orange: "bg-orange-500",
};

export function PotCard({
  pot,
  accounts,
  contributions,
}: {
  pot: SavingsPot;
  accounts: SavingsAccount[];
  contributions: SavingsContribution[];
}) {
  const pct =
    pot.target_amount > 0 ? Math.min(100, (pot.current_amount / pot.target_amount) * 100) : 0;
  const remaining = Math.max(0, pot.target_amount - pot.current_amount);

  return (
    <Card className="relative">
      <CardContent className="space-y-4 p-5">
        {/* Edit / delete float top-right, outside the clickable area. */}
        <div className="absolute right-3 top-3 flex items-center">
          <PotForm
            pot={pot}
            trigger={
              <button className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            }
          />
          <ConfirmDelete itemLabel="pot" action={deletePot.bind(null, pot.id)} />
        </div>

        <PotDetailDialog pot={pot} accounts={accounts} contributions={contributions}>
          <CardTrigger className="space-y-4 rounded-md">
            <div className="flex items-center gap-2 pr-16">
              <span className={`h-3 w-3 rounded-full ${COLOR_BG[pot.color] ?? "bg-primary"}`} />
              <span className="font-semibold hover:underline">{pot.name}</span>
            </div>
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-xl font-semibold">{formatCurrency(pot.current_amount)}</span>
                <span className="text-sm text-muted-foreground">of {formatCurrency(pot.target_amount)}</span>
              </div>
              <Progress value={pct} indicatorClassName={COLOR_BG[pot.color] ?? "bg-primary"} />
              <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>{Math.round(pct)}% saved</span>
                {remaining > 0 ? <span>{formatCurrency(remaining)} to go</span> : <Badge variant="success">Complete</Badge>}
              </div>
            </div>
          </CardTrigger>
        </PotDetailDialog>

        <div className="flex items-center justify-end">
          <QuickContribute pot={pot} />
        </div>
      </CardContent>
    </Card>
  );
}
