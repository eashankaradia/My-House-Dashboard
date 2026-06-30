"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usernameToEmail } from "@/lib/auth-username";
import { updateDisplayName } from "@/app/(app)/settings/actions";

export function SignUp() {
  const supabase = createClient();
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [pendingConfirm, setPendingConfirm] = React.useState(false);

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Password too short", description: "Use at least 6 characters." });
      return;
    }
    if (password !== confirm) {
      toast({ variant: "destructive", title: "Passwords don't match" });
      return;
    }
    setLoading(true);
    const email = usernameToEmail(username);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name.trim() } },
    });
    if (error) {
      setLoading(false);
      let description = error.message;
      if (/already registered|already exists/i.test(error.message)) {
        description = `Username "${username}" is already taken.`;
      }
      toast({ variant: "destructive", title: "Couldn't create account", description });
      return;
    }

    if (!data.session) {
      // Email confirmation is required and this is an internal, unreachable
      // address — the account exists but can't confirm itself.
      setLoading(false);
      setPendingConfirm(true);
      return;
    }

    if (name.trim()) {
      await updateDisplayName(name.trim());
    }
    window.location.assign("/dashboard");
  }

  if (pendingConfirm) {
    return (
      <div className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
        <p className="font-medium">Account created — needs confirming</p>
        <p className="text-muted-foreground">
          This deployment requires email confirmation, but usernames don&apos;t use a real inbox. Ask an admin to
          confirm &ldquo;{username}&rdquo; in Supabase → Authentication → Users, or disable &ldquo;Confirm
          email&rdquo; for the project so new accounts can sign in right away.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={signUp} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="su_name">Your name</Label>
        <Input id="su_name" placeholder="e.g. Eashan" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su_username">Username</Label>
        <Input
          id="su_username"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="username"
          placeholder="e.g. eashan"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su_password">Password</Label>
        <Input
          id="su_password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su_confirm">Confirm password</Label>
        <Input
          id="su_confirm"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>
      <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
        <UserPlus className="h-4 w-4" />
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
