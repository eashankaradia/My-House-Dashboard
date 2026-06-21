"use client";

import * as React from "react";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usernameToEmail } from "@/lib/auth-username";

/**
 * Username + password sign-in.
 *
 * Supabase Auth is email-based, so a username is transparently mapped to a
 * fixed internal email (e.g. "eashan" -> "eashan@myhouse.local") before calling
 * Supabase. No email is ever sent — the shared account is created once in the
 * Supabase dashboard with the matching internal email. This is the most
 * reliable option for a small shared household: works on every device, with no
 * magic links, codes, or email rate limits.
 */
export function PasswordSignIn() {
  const supabase = createClient();
  const { toast } = useToast();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const email = usernameToEmail(username);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      let description = error.message;
      if (/confirm/i.test(error.message)) {
        description =
          "This account isn't confirmed. In Supabase → Authentication → Users, recreate it with “Auto Confirm User” ticked.";
      } else if (/invalid login/i.test(error.message)) {
        description = `No account matched. Make sure a Supabase user exists with email "${email}" and this password.`;
      }
      toast({ variant: "destructive", title: "Sign-in failed", description });
      return;
    }
    // Full navigation so the server middleware picks up the new session cookie.
    window.location.assign("/dashboard");
  }

  return (
    <form onSubmit={signIn} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
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
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
        <LogIn className="h-4 w-4" />
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
