"use client";

import * as React from "react";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

/**
 * Email + password sign-in. The most reliable option for a small shared
 * household account: no email delivery involved, works on every device, and
 * sidesteps magic-link scanners and the built-in email rate limit. The shared
 * account is created once in the Supabase dashboard (Authentication → Users).
 */
export function PasswordSignIn() {
  const supabase = createClient();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Sign-in failed", description: error.message });
      return;
    }
    // Full navigation so the server middleware picks up the new session cookie.
    window.location.assign("/dashboard");
  }

  return (
    <form onSubmit={signIn} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
