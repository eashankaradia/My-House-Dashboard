"use client";

import * as React from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/shared/form-field";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { useToast } from "@/hooks/use-toast";
import type { MemberMap } from "@/lib/household";
import type { PaymentAccount } from "@/lib/database.types";
import { createPaymentAccount, deletePaymentAccount, updatePaymentAccount } from "./actions";

export function PaymentAccounts({
  accounts,
  memberMap,
}: {
  accounts: PaymentAccount[];
  memberMap: MemberMap;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Payment accounts</CardTitle>
          <CardDescription>Assign bills to a personal or joint account.</CardDescription>
        </div>
        <AccountForm memberMap={memberMap} />
      </CardHeader>
      <CardContent className="space-y-2">
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No accounts yet. Add one to organise bill payments.</p>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{account.name}</p>
                <p className="text-xs text-muted-foreground">
                  {account.owner_user_id ? memberMap[account.owner_user_id] ?? "Household member" : "Joint account"}
                  {account.notes ? ` · ${account.notes}` : ""}
                </p>
              </div>
              <AccountForm account={account} memberMap={memberMap} />
              <ConfirmDelete itemLabel="payment account" action={deletePaymentAccount.bind(null, account.id)} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AccountForm({
  account,
  memberMap,
}: {
  account?: PaymentAccount;
  memberMap: MemberMap;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(account?.name ?? "");
  const [ownerUserId, setOwnerUserId] = React.useState(account?.owner_user_id ?? "");
  const [notes, setNotes] = React.useState(account?.notes ?? "");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const payload = { name, owner_user_id: ownerUserId || undefined, notes: notes || undefined };
      const result = account
        ? await updatePaymentAccount(account.id, payload)
        : await createPaymentAccount(payload);
      if (result.error) {
        toast({ variant: "destructive", title: "Couldn't save account", description: result.error });
        return;
      }
      setOpen(false);
      toast({ title: account ? "Account updated" : "Account added" });
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {account ? (
          <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /> Edit</Button>
        ) : (
          <Button variant="outline" size="sm"><Plus className="h-4 w-4" /> Add account</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{account ? "Edit account" : "Add payment account"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Account name" required>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Joint current account" />
          </Field>
          <Field label="Associated with">
            <NativeSelect value={ownerUserId} onChange={(event) => setOwnerUserId(event.target.value)}>
              <option value="">Joint account</option>
              {Object.entries(memberMap).map(([id, displayName]) => (
                <option key={id} value={id}>{displayName}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Notes">
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending || !name.trim()}>{pending ? "Saving…" : "Save account"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
