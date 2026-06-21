"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { AddedBy } from "@/components/shared/added-by";
import { FREQUENCY_LABELS } from "@/lib/constants";
import { cn, formatCurrency, formatDate, toMonthly } from "@/lib/utils";
import type { MemberMap } from "@/lib/household";
import type { Bill } from "@/lib/database.types";
import { BillForm } from "./bill-form";
import { BillDetailDialog } from "./bill-detail";
import { deleteBill } from "./actions";

export function BillsList({ bills, memberMap }: { bills: Bill[]; memberMap: MemberMap }) {
  const [compact, setCompact] = React.useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>All bills</CardTitle>
        <div className="flex items-center rounded-lg border p-0.5 text-xs">
          <button onClick={() => setCompact(false)} className={cn("rounded-md px-2 py-1", !compact && "bg-accent")}>
            Detailed
          </button>
          <button onClick={() => setCompact(true)} className={cn("rounded-md px-2 py-1", compact && "bg-accent")}>
            Compact
          </button>
        </div>
      </CardHeader>
      <CardContent className="divide-y">
        {bills.map((bill) =>
          compact ? (
            <div key={bill.id} className="flex items-center gap-3 py-2 text-sm first:pt-0 last:pb-0">
              <BillDetailDialog bill={bill} memberMap={memberMap}>
                <button className="min-w-0 flex-1 truncate text-left font-medium hover:underline">{bill.name}</button>
              </BillDetailDialog>
              <Badge variant="secondary">{bill.category}</Badge>
              {bill.due_date ? (
                <span className="hidden w-20 shrink-0 text-right text-xs text-muted-foreground sm:block">
                  {formatDate(bill.due_date)}
                </span>
              ) : null}
              <span className="w-20 shrink-0 text-right font-semibold">
                {formatCurrency(toMonthly(bill.amount, bill.frequency))}
                <span className="text-xs font-normal text-muted-foreground">/mo</span>
              </span>
              <div className="flex shrink-0 items-center">
                <BillForm
                  bill={bill}
                  trigger={
                    <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                  }
                />
                <ConfirmDelete itemLabel="bill" action={deleteBill.bind(null, bill.id)} />
              </div>
            </div>
          ) : (
            <div key={bill.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <BillDetailDialog bill={bill} memberMap={memberMap}>
                    <button className="truncate text-left font-medium hover:underline">{bill.name}</button>
                  </BillDetailDialog>
                  <Badge variant="secondary">{bill.category}</Badge>
                  {!bill.is_fixed ? <Badge variant="outline">Variable</Badge> : null}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {FREQUENCY_LABELS[bill.frequency]}
                    {bill.payment_account ? ` · ${bill.payment_account}` : ""}
                    {bill.due_date ? ` · due ${formatDate(bill.due_date)}` : ""}
                  </span>
                  <AddedBy name={memberMap[bill.user_id]} />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(bill.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(toMonthly(bill.amount, bill.frequency))}/mo
                  </p>
                </div>
                <BillForm
                  bill={bill}
                  trigger={
                    <button className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                      <span className="sr-only">Edit</span>
                      <Pencil className="h-4 w-4" />
                    </button>
                  }
                />
                <ConfirmDelete itemLabel="bill" action={deleteBill.bind(null, bill.id)} />
              </div>
            </div>
          ),
        )}
      </CardContent>
    </Card>
  );
}
