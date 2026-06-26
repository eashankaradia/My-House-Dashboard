"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/shared/form-field";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Bill, BillPayment, PaymentAccount } from "@/lib/database.types";
import {
  createBillPayment,
  deleteBillPayment,
  markHistoryPaid,
  setPaymentPaid,
  syncBillPayments,
  updateBillPaymentDetail,
} from "./actions";

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
  const [busy, startTransition] = React.useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const synced = React.useRef(false);

  // Fill in any missing due dates for THIS bill — at most once per day per
  // device, and only refresh the page if rows were actually created.
  React.useEffect(() => {
    if (synced.current) return;
    synced.current = true;
    const key = `mhd:bill-synced:${bill.id}`;
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (localStorage.getItem(key) === today) return;
    } catch {}
    syncBillPayments(bill.id).then((res) => {
      try {
        localStorage.setItem(key, today);
      } catch {}
      if (res?.inserted) router.refresh();
    });
  }, [router, bill.id]);

  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...payments].sort((a, b) => b.payment_date.localeCompare(a.payment_date));
  const unpaidPast = sorted.filter((p) => !p.is_paid && p.payment_date <= today).length;
  const paidTotal = payments.filter((p) => p.is_paid).reduce((s, p) => s + Number(p.actual_amount ?? p.expected_amount), 0);

  function run(fn: () => Promise<{ error?: string } | void>, okTitle?: string) {
    startTransition(async () => {
      const res = await fn();
      if (res?.error) toast({ variant: "destructive", title: "Something went wrong", description: res.error });
      else {
        if (okTitle) toast({ title: okTitle });
        router.refresh();
      }
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Payments</p>
          {payments.length > 0 ? (
            <p className="text-xs text-muted-foreground">Paid to date {formatCurrency(paidTotal)}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {unpaidPast > 0 ? (
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => run(() => markHistoryPaid(bill.id), "Marked all as paid")}>
              Mark all paid ({unpaidPast})
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding((v) => !v)}>
            <Plus className="h-4 w-4" /> Log
          </Button>
        </div>
      </div>

      {adding ? <PaymentForm bill={bill} accounts={accounts} onDone={() => { setAdding(false); router.refresh(); }} /> : null}

      {payments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No payments yet. They’ll appear here as they fall due.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {sorted.map((payment) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              accounts={accounts}
              today={today}
              busy={busy}
              onToggle={(paid) => run(() => setPaymentPaid(payment.id, paid))}
              onSaveDetail={(detail) => run(() => updateBillPaymentDetail(payment.id, detail), "Payment updated")}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PaymentRow({
  payment,
  accounts,
  today,
  busy,
  onToggle,
  onSaveDetail,
}: {
  payment: BillPayment;
  accounts: PaymentAccount[];
  today: string;
  busy: boolean;
  onToggle: (paid: boolean) => void;
  onSaveDetail: (detail: { actual_amount?: number | null; account_id?: string | null; notes?: string | null }) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [actual, setActual] = React.useState(String(payment.actual_amount ?? payment.expected_amount));
  const [accountId, setAccountId] = React.useState(payment.account_id ?? "");
  const [notes, setNotes] = React.useState(payment.notes ?? "");
  const accountNames = new Map(accounts.map((a) => [a.id, a.name]));
  const upcoming = payment.payment_date > today;

  return (
    <div className="text-sm">
      <div className="flex items-center gap-3 px-3 py-2">
        <button
          type="button"
          disabled={busy}
          aria-label={payment.is_paid ? "Mark unpaid" : "Mark paid"}
          aria-pressed={payment.is_paid}
          onClick={() => onToggle(!payment.is_paid)}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
            payment.is_paid ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/40 hover:border-foreground",
          )}
        >
          {payment.is_paid ? <Check className="h-3.5 w-3.5" /> : null}
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} className="min-w-0 flex-1 text-left">
          <p className="flex items-center gap-1.5 font-medium">
            {formatDate(payment.payment_date)}
            {upcoming ? <span className="rounded bg-muted px-1.5 text-[10px] text-muted-foreground">Upcoming</span> : null}
            {!payment.is_paid && !upcoming ? <span className="rounded bg-amber-100 px-1.5 text-[10px] text-amber-700 dark:bg-amber-950 dark:text-amber-300">Due</span> : null}
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(payment.actual_amount ?? payment.expected_amount)}
            {payment.account_id ? ` · ${accountNames.get(payment.account_id) ?? "Account"}` : ""}
            {payment.notes ? ` · ${payment.notes}` : ""}
          </p>
        </button>
        <ConfirmDelete itemLabel="payment" action={deleteBillPayment.bind(null, payment.id)} />
      </div>

      {open ? (
        <div className="space-y-2 border-t bg-muted/20 px-3 py-2.5">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Actual (£)"><Input type="number" step="0.01" value={actual} onChange={(e) => setActual(e.target.value)} /></Field>
            <Field label="Account">
              <NativeSelect value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">No account</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </NativeSelect>
            </Field>
          </div>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note (optional)" />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => { onSaveDetail({ actual_amount: Number(actual), account_id: accountId || null, notes: notes || null }); setOpen(false); }}
            >
              Save detail
            </Button>
          </div>
        </div>
      ) : null}
    </div>
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
