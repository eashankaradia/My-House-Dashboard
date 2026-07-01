"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { AddedBy } from "@/components/shared/added-by";
import { CardTrigger } from "@/components/shared/card-trigger";
import { FREQUENCY_LABELS, ITEM_SCOPE_LABELS } from "@/lib/constants";
import { cn, formatCurrency, formatDate, toMonthly } from "@/lib/utils";
import type { MemberMap } from "@/lib/household";
import type { Bill, BillContributor, BillPayment, HouseholdMember, PaymentAccount } from "@/lib/database.types";
import { BillForm } from "./bill-form";
import { BillDetailDialog } from "./bill-detail";
import { deleteBill } from "./actions";

export function BillsList({
  bills,
  accounts,
  payments,
  contributors,
  members,
  memberMap,
}: {
  bills: Bill[];
  accounts: PaymentAccount[];
  payments: BillPayment[];
  contributors: BillContributor[];
  members: HouseholdMember[];
  memberMap: MemberMap;
}) {
  const [compact, setCompact] = React.useState(true);
  const [scopeFilter, setScopeFilter] = React.useState<"all" | "personal" | "household">("all");
  const isLife = process.env.NEXT_PUBLIC_APP === "life";
  const accountNames = new Map(accounts.map((account) => [account.id, account.name]));
  const visibleBills = bills.filter((b) => (scopeFilter === "all" ? true : b.scope === scopeFilter));

  return (
    <Card>
      <CardHeader className="flex-col items-stretch gap-2 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>All bills</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {isLife ? (
            <div className="flex items-center rounded-lg border p-0.5 text-xs">
              {(["all", "household", "personal"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScopeFilter(s)}
                  className={cn("rounded-md px-2.5 py-1", scopeFilter === s && "bg-accent")}
                >
                  {s === "all" ? "All" : ITEM_SCOPE_LABELS[s]}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex items-center rounded-lg border p-0.5 text-xs">
            <button onClick={() => setCompact(false)} className={cn("rounded-md px-2 py-1", !compact && "bg-accent")}>
              Detailed
            </button>
            <button onClick={() => setCompact(true)} className={cn("rounded-md px-2 py-1", compact && "bg-accent")}>
              Compact
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="divide-y">
        {visibleBills.map((bill) =>
          compact ? (
            <div key={bill.id} className="flex items-center gap-3 py-2 text-sm first:pt-0 last:pb-0">
              <BillDetailDialog bill={bill} accounts={accounts} payments={payments.filter((payment) => payment.bill_id === bill.id)} contributors={contributors.filter((c) => c.bill_id === bill.id)} members={members} memberMap={memberMap}>
                <CardTrigger className="flex min-w-0 flex-1 items-center gap-3 rounded-md">
                  <span className="min-w-0 flex-1 truncate font-medium">{bill.name}</span>
                  <Badge variant="secondary">{bill.category}</Badge>
                  {isLife && bill.scope === "personal" ? <Badge variant="outline">Personal</Badge> : null}
                  {bill.due_date ? (
                    <span className="hidden w-20 shrink-0 text-right text-xs text-muted-foreground sm:block">
                      {formatDate(bill.due_date)}
                    </span>
                  ) : null}
                  <span className="w-20 shrink-0 text-right font-semibold">
                    {formatCurrency(toMonthly(bill.amount, bill.frequency))}
                    <span className="text-xs font-normal text-muted-foreground">/mo</span>
                  </span>
                </CardTrigger>
              </BillDetailDialog>
              <div className="flex shrink-0 items-center">
                <BillForm
                  bill={bill}
                  accounts={accounts}
                  trigger={
                    <button className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                  }
                />
                <ConfirmDelete itemLabel="bill" action={deleteBill.bind(null, bill.id)} />
              </div>
            </div>
          ) : (
            <div key={bill.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <BillDetailDialog bill={bill} accounts={accounts} payments={payments.filter((payment) => payment.bill_id === bill.id)} contributors={contributors.filter((c) => c.bill_id === bill.id)} members={members} memberMap={memberMap}>
                <CardTrigger className="min-w-0 flex-1 rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{bill.name}</span>
                    <Badge variant="secondary">{bill.category}</Badge>
                    {!bill.is_fixed ? <Badge variant="outline">Variable</Badge> : null}
                    {isLife && bill.scope === "personal" ? <Badge variant="outline">Personal</Badge> : null}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {FREQUENCY_LABELS[bill.frequency]}
                      {bill.account_id ? ` - ${accountNames.get(bill.account_id) ?? "Account"}` : bill.payment_account ? ` - ${bill.payment_account}` : ""}
                      {bill.start_date ? ` - started ${formatDate(bill.start_date)}` : ""}
                      {bill.due_date ? ` - due ${formatDate(bill.due_date)}` : ""}
                      {bill.end_date ? ` - ends ${formatDate(bill.end_date)}` : ""}
                    </span>
                    <AddedBy name={memberMap[bill.user_id]} />
                  </div>
                </CardTrigger>
              </BillDetailDialog>
              <div className="flex items-center gap-1">
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(bill.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(toMonthly(bill.amount, bill.frequency))}/mo
                  </p>
                </div>
                <BillForm
                  bill={bill}
                  accounts={accounts}
                  trigger={
                    <button className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                      Edit
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
