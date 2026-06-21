"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SavingsPot } from "@/lib/database.types";
import { PotForm } from "./pot-form";
import { deletePot } from "./actions";

export function PotDetailDialog({ pot, children }: { pot: SavingsPot; children: React.ReactNode }) {
  const pct = pot.target_amount > 0 ? Math.min(100, (pot.current_amount / pot.target_amount) * 100) : 0;
  const remaining = Math.max(0, pot.target_amount - pot.current_amount);

  let forecast: string | null = null;
  if (remaining > 0 && pot.monthly_contribution > 0) {
    const months = Math.ceil(remaining / pot.monthly_contribution);
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    forecast = formatDate(d);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{pot.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-semibold">{formatCurrency(pot.current_amount)}</span>
              <span className="text-sm text-muted-foreground">of {formatCurrency(pot.target_amount)}</span>
            </div>
            <Progress value={pct} />
            <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round(pct)}% saved</span>
              {remaining > 0 ? <span>{formatCurrency(remaining)} to go</span> : <Badge variant="success">Complete</Badge>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Monthly" value={formatCurrency(pot.monthly_contribution)} />
            <Detail label="Target date" value={formatDate(pot.target_date)} />
            {forecast ? <Detail label="On track for" value={forecast} /> : null}
          </div>
          {pot.notes ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Notes</p>
              <p className="text-sm">{pot.notes}</p>
            </div>
          ) : null}
          <div className="flex items-center justify-end gap-2 border-t pt-3">
            <PotForm pot={pot} />
            <ConfirmDelete itemLabel="pot" action={deletePot.bind(null, pot.id)} variant="menu" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
