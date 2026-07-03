"use client";

import * as React from "react";
import { KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/form-field";
import { useToast } from "@/hooks/use-toast";

export function ChangePassword() {
  const supabase = createClient();
  const { toast } = useToast();
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 6) {
      toast({ variant: "destructive", title: "Password too short", description: "Use at least 6 characters." });
      return;
    }
    if (next !== confirm) {
      toast({ variant: "destructive", title: "Passwords don't match" });
      return;
    }
    setPending(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
      if (reauthError) {
        setPending(false);
        toast({ variant: "destructive", title: "Current password is incorrect" });
        return;
      }
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    setPending(false);
    if (error) {
      toast({ variant: "destructive", title: "Couldn't update password", description: error.message });
      return;
    }
    toast({ title: "Password updated" });
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-3">
      <Field label="Current password" htmlFor="current_password">
        <Input
          id="current_password"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
      </Field>
      <Field label="New password" htmlFor="new_password">
        <Input
          id="new_password"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
        />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm_password">
        <Input
          id="confirm_password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </Field>
      <Button type="submit" disabled={pending} className="gap-2">
        <KeyRound className="h-4 w-4" />
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
