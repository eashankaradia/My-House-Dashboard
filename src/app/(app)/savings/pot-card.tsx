"use client";

import * as React from "react";
import { Minus, Pencil, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SavingsAccount, SavingsContribution, SavingsPot } from "@/lib/database.types";
import { PotForm } from "./pot-form";
import { PotDetailDialog } from "./pot-detail";
import { adjustPot, deletePot } from "./actions";

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
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const pct =
    pot.target_amount > 0 ? Math.min(100, (pot.current_amount / pot.target_amount) * 100) : 0;
  const remaining = Math.max(0, pot.target_amount - pot.current_amount);

  // Forecast completion from monthly contribution.
  let forecast: string | null = null;
  if (remaining > 0 && pot.monthly_contribution > 0) {
    const months = Math.ceil(remaining / pot.monthly_contribution);
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    forecast = formatDate(d);
  }

  function adjust(delta: number) {
    startTransition(async () => {
      const res = await adjustPot(pot.id, delta);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't update", description: res.error });
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${COLOR_BG[pot.color] ?? "bg-primary"}`} />
            <PotDetailDialog pot={pot} accounts={accounts} contributions={contributions}>
              <button className="text-left font-semibold hover:underline">{pot.name}</button>
            </PotDetailDialog>
          </div>
          <div className="flex items-center">
            <PotForm
              pot={pot}
              trigger={
                <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                  <Pencil className="h-4 w-4" />
                </button>
              }
            />
            <ConfirmDelete itemLabel="pot" action={deletePot.bind(null, pot.id)} />
          </div>
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

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {pot.monthly_contribution > 0 ? (
              <span>{formatCurrency(pot.monthly_contribution)}/mo{forecast ? ` · done ${forecast}` : ""}</span>
            ) : (
              <span>No monthly plan</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={pending}
              onClick={() => adjust(-50)}
              aria-label="Remove £50"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={pending}
              onClick={() => adjust(50)}
              aria-label="Add £50"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
