"use client";

import * as React from "react";
import { Pencil, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/shared/form-field";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { ShareButton } from "@/components/shared/share-button";
import { PointOutButton } from "@/components/shared/point-out-button";
import { ItemTimestamps } from "@/components/shared/item-timestamps";
import { ItemComments } from "@/components/shared/item-comments";
import { AreaChart } from "@/components/charts/area-chart";
import { useToast } from "@/hooks/use-toast";
import { useOpenFromUrl } from "@/hooks/use-open-from-url";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { SavingsAccount, SavingsContribution, SavingsPot } from "@/lib/database.types";
import { PotForm } from "./pot-form";
import {
  addContribution,
  createAccount,
  deleteAccount,
  deleteContribution,
  deletePot,
  updateAccount,
} from "./actions";

const todayISO = () => new Date().toISOString().slice(0, 10);

export function PotDetailDialog({
  pot,
  accounts,
  contributions,
  children,
}: {
  pot: SavingsPot;
  accounts: SavingsAccount[];
  contributions: SavingsContribution[];
  children: React.ReactNode;
}) {
  const { open, onOpenChange } = useOpenFromUrl(pot.id);
  const pct = pot.target_amount > 0 ? Math.min(100, (pot.current_amount / pot.target_amount) * 100) : 0;
  const remaining = Math.max(0, pot.target_amount - pot.current_amount);

  // Per-account balance is the sum of that account's contributions.
  const balanceOf = React.useCallback(
    (accountId: string) =>
      contributions.filter((c) => c.account_id === accountId).reduce((s, c) => s + Number(c.amount), 0),
    [contributions],
  );
  const accountName = React.useMemo(() => {
    const m = new Map(accounts.map((a) => [a.id, a.name]));
    return (id: string | null) => (id ? m.get(id) ?? "—" : null);
  }, [accounts]);

  const assigned = accounts.reduce((s, a) => s + balanceOf(a.id), 0);
  const unassigned = Number(pot.current_amount) - assigned;

  // Build a cumulative balance line that ends at the pot's current total.
  const series = React.useMemo(() => {
    const byDate = new Map<string, number>();
    for (const c of contributions) byDate.set(c.occurred_on, (byDate.get(c.occurred_on) ?? 0) + Number(c.amount));
    const dates = [...byDate.keys()].sort((a, b) => a.localeCompare(b));
    if (dates.length === 0) return [];
    const totalContrib = contributions.reduce((s, c) => s + Number(c.amount), 0);
    let running = Number(pot.current_amount) - totalContrib;
    const points = [{ name: "Start", value: Math.round(running) }];
    for (const d of dates) {
      running += byDate.get(d)!;
      points.push({ name: formatDate(d), value: Math.round(running) });
    }
    return points;
  }, [contributions, pot.current_amount]);

  const recent = React.useMemo(
    () => [...contributions].sort((a, b) => b.occurred_on.localeCompare(a.occurred_on)),
    [contributions],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pot.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Headline progress */}
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

          {/* Balance over time */}
          {series.length > 1 ? (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Balance over time</p>
              <AreaChart data={series} height={180} />
            </div>
          ) : null}

          {/* Accounts */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Accounts</h3>
              <AccountForm
                potId={pot.id}
                trigger={
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Add account
                  </Button>
                }
              />
            </div>
            {accounts.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No accounts yet — add one to record which account holds this pot&apos;s money.
              </p>
            ) : (
              <div className="space-y-1.5">
                {accounts.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{a.name}</p>
                      {a.notes ? <p className="truncate text-xs text-muted-foreground">{a.notes}</p> : null}
                      <p className="text-[11px] text-muted-foreground">
                        Added {formatDate(a.created_at)} · updated {formatDate(a.updated_at)}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium">{formatCurrency(balanceOf(a.id))}</span>
                    <AccountForm
                      potId={pot.id}
                      account={a}
                      trigger={
                        <button className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      }
                    />
                    <ConfirmDelete itemLabel="account" action={deleteAccount.bind(null, a.id)} />
                  </div>
                ))}
                {Math.abs(unassigned) > 0.005 ? (
                  <div className="flex items-center justify-between rounded-lg border border-dashed p-2.5 text-sm text-muted-foreground">
                    <span>Unassigned</span>
                    <span className="font-medium">{formatCurrency(unassigned)}</span>
                  </div>
                ) : null}
              </div>
            )}
          </section>

          {/* Contributions */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Contributions</h3>
            </div>
            <ContributionForm potId={pot.id} accounts={accounts} />
            {recent.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No contributions logged yet. Add one above — you can back-date it.
              </p>
            ) : (
              <div className="divide-y rounded-lg border">
                {recent.slice(0, 12).map((c) => {
                  const amt = Number(c.amount);
                  return (
                    <div key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <span className={cn("font-medium", amt < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}>
                          {amt < 0 ? "−" : "+"}
                          {formatCurrency(Math.abs(amt))}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {formatDate(c.occurred_on)}
                          {accountName(c.account_id) ? ` · ${accountName(c.account_id)}` : ""}
                          {c.note ? ` · ${c.note}` : ""}
                        </span>
                      </div>
                      <DeleteContributionButton id={c.id} />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="border-t pt-3">
            <ItemComments entityType="savings_pots" entityId={pot.id} ownerId={pot.user_id} href={`/savings?item=${pot.id}`} label={pot.name} />
          </div>

          {/* Footer actions */}
          <ItemTimestamps createdAt={pot.created_at} updatedAt={pot.updated_at} />
          <div className="flex items-center justify-end gap-2 border-t pt-3">
            <ShareButton title={pot.name} text={`${formatCurrency(pot.current_amount)} saved of ${formatCurrency(pot.target_amount)}`} />
            <PointOutButton label={pot.name} href={`/savings?item=${pot.id}`} />
            <PotForm pot={pot} />
            <ConfirmDelete itemLabel="pot" action={deletePot.bind(null, pot.id)} variant="menu" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteContributionButton({ id }: { id: string }) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const res = await deleteContribution(id);
          if (res?.error) toast({ variant: "destructive", title: "Couldn't remove", description: res.error });
        })
      }
      disabled={pending}
      className="shrink-0 text-muted-foreground hover:text-destructive"
      aria-label="Delete contribution"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

function AccountForm({
  potId,
  account,
  trigger,
}: {
  potId: string;
  account?: SavingsAccount;
  trigger: React.ReactNode;
}) {
  const editing = Boolean(account);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(account?.name ?? "");
  const [notes, setNotes] = React.useState(account?.notes ?? "");
  const [opening, setOpening] = React.useState("");
  const [openingDate, setOpeningDate] = React.useState(todayISO());
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const payload = {
        name,
        notes: notes || undefined,
        opening_balance: editing ? undefined : opening ? Number(opening) : undefined,
        opening_date: editing ? undefined : openingDate,
      };
      const res = editing ? await updateAccount(account!.id, payload) : await createAccount(potId, payload);
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't save account", description: res.error });
        return;
      }
      toast({ title: editing ? "Account updated" : "Account added" });
      setOpen(false);
      if (!editing) {
        setName("");
        setNotes("");
        setOpening("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit account" : "Add an account"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Account name" htmlFor="acc-name" required>
            <Input id="acc-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Marcus, Chase ISA" />
          </Field>
          <Field label="Notes" htmlFor="acc-notes">
            <Input id="acc-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional — sort code, rate…" />
          </Field>
          {!editing ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Opening balance (£)" htmlFor="acc-open" tooltip="Optional. Logged as the account's first contribution.">
                <Input id="acc-open" type="number" step="0.01" value={opening} onChange={(e) => setOpening(e.target.value)} placeholder="0.00" />
              </Field>
              <Field label="As of" htmlFor="acc-open-date">
                <Input id="acc-open-date" type="date" value={openingDate} onChange={(e) => setOpeningDate(e.target.value)} />
              </Field>
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? "Saving…" : editing ? "Save" : "Add account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContributionForm({ potId, accounts }: { potId: string; accounts: SavingsAccount[] }) {
  const [direction, setDirection] = React.useState<"deposit" | "withdrawal">("deposit");
  const [amount, setAmount] = React.useState("");
  const [accountId, setAccountId] = React.useState("");
  const [date, setDate] = React.useState(todayISO());
  const [note, setNote] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;
    startTransition(async () => {
      const res = await addContribution(potId, {
        amount: value,
        direction,
        account_id: accountId || undefined,
        occurred_on: date,
        note: note || undefined,
      });
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't add", description: res.error });
        return;
      }
      toast({ title: direction === "deposit" ? "Contribution added" : "Withdrawal logged" });
      setAmount("");
      setNote("");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 rounded-lg border bg-card/40 p-3">
      <div className="flex flex-wrap items-end gap-2">
        <NativeSelect
          value={direction}
          onChange={(e) => setDirection(e.target.value as "deposit" | "withdrawal")}
          className="h-9 w-32"
          aria-label="Direction"
        >
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
        </NativeSelect>
        <Input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount £"
          className="w-28 flex-1"
        />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" aria-label="Date" />
      </div>
      <div className="flex flex-wrap items-end gap-2">
        {accounts.length > 0 ? (
          <NativeSelect value={accountId} onChange={(e) => setAccountId(e.target.value)} className="h-9 flex-1" aria-label="Account">
            <option value="">No account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </NativeSelect>
        ) : null}
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="flex-1" />
        <Button type="submit" disabled={pending || !amount} className="gap-1.5">
          <Plus className="h-4 w-4" /> Log
        </Button>
      </div>
    </form>
  );
}
