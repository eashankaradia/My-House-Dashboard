"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/shared/form-field";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Bill, BillPayment, PaymentAccount } from "@/lib/database.types";
import { createBillPayment, deleteBillPayment } from "./actions";

export function BillPayments({
  bill,
  payments,
  accounts,
}: {
  bill: Bill;
  payments: BillPayment[];
  accounts: PaymentAccount[];
}) {
  const [adding, setAdding] = React.useState(false);
  const accountNames = new Map(accounts.map((account) => [account.id, account.name]));
  const expectedTotal = payments.reduce((sum, payment) => sum + Number(payment.expected_amount), 0);
  const actualTotal = payments.reduce(
    (sum, payment) => sum + Number(payment.actual_amount ?? payment.expected_amount),
    0,
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Payment history</p>
          {payments.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Expected {formatCurrency(expectedTotal)} · Actual {formatCurrency(actualTotal)} · Difference{" "}
              {formatCurrency(actualTotal - expectedTotal)}
            </p>
          ) : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setAdding((value) => !value)}>
          <Plus className="h-4 w-4" /> Log payment
        </Button>
      </div>
      {adding ? <PaymentForm bill={bill} accounts={accounts} onDone={() => setAdding(false)} /> : null}
      {payments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No payments logged yet.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {payments.map((payment) => {
            const actual = Number(payment.actual_amount ?? payment.expected_amount);
            const difference = actual - Number(payment.expected_amount);
            return (
              <div key={payment.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{formatDate(payment.payment_date)}</p>
                  <p className="text-xs text-muted-foreground">
                    Expected {formatCurrency(payment.expected_amount)} · Actual {formatCurrency(actual)}
                    {payment.account_id ? ` · ${accountNames.get(payment.account_id) ?? "Account"}` : ""}
                    {payment.notes ? ` · ${payment.notes}` : ""}
                  </p>
                </div>
                <span className={difference === 0 ? "text-muted-foreground" : difference > 0 ? "text-destructive" : "text-emerald-600"}>
                  {difference > 0 ? "+" : ""}{formatCurrency(difference)}
                </span>
                <ConfirmDelete itemLabel="payment" action={deleteBillPayment.bind(null, payment.id)} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PaymentForm({
  bill,
  accounts,
  onDone,
}: {
  bill: Bill;
  accounts: PaymentAccount[];
  onDone: () => void;
}) {
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [expected, setExpected] = React.useState(String(bill.amount));
  const [actual, setActual] = React.useState(String(bill.amount));
  const [accountId, setAccountId] = React.useState(bill.account_id ?? "");
  const [notes, setNotes] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createBillPayment(bill.id, {
        payment_date: date,
        expected_amount: Number(expected),
        actual_amount: Number(actual),
        account_id: accountId || undefined,
        notes: notes || undefined,
      });
      if (result.error) {
        toast({ variant: "destructive", title: "Couldn't log payment", description: result.error });
        return;
      }
      toast({ title: "Payment logged" });
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="grid grid-cols-3 gap-2">
        <Field label="Payment date"><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
        <Field label="Expected (£)"><Input type="number" step="0.01" value={expected} onChange={(event) => setExpected(event.target.value)} /></Field>
        <Field label="Actual (£)"><Input type="number" step="0.01" value={actual} onChange={(event) => setActual(event.target.value)} /></Field>
      </div>
      <div className="flex gap-2">
        <NativeSelect value={accountId} onChange={(event) => setAccountId(event.target.value)} className="flex-1">
          <option value="">No account</option>
          {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
        </NativeSelect>
        <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Note (optional)" className="flex-1" />
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}
