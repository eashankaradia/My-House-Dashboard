"use client";

import * as React from "react";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

/**
 * Passwordless email sign-in. Sends a magic link that returns to /auth/callback,
 * so it reuses the same OAuth callback flow — and needs no Google Cloud setup.
 */
export function EmailSignIn() {
  const supabase = createClient();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Couldn't send link", description: error.message });
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-lg border bg-accent/40 px-4 py-3 text-center text-sm">
        <p className="font-medium">Check your inbox ✉️</p>
        <p className="text-muted-foreground">
          We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-1 text-xs text-primary hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={signIn} className="space-y-2">
      <Input
        type="email"
        inputMode="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" variant="outline" size="lg" className="w-full gap-2" disabled={loading}>
        <Mail className="h-4 w-4" />
        {loading ? "Sending…" : "Email me a sign-in link"}
      </Button>
    </form>
  );
}
