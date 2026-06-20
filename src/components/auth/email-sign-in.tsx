"use client";

import * as React from "react";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

/**
 * Passwordless email sign-in using a 6-digit one-time code (OTP).
 *
 * We deliberately use a typed code rather than a magic link: email security
 * scanners (Outlook Safe Links, antivirus, etc.) often pre-fetch magic links
 * and consume the single-use token before the user clicks, causing
 * "otp_expired". A code has no link to pre-fetch and works across any device.
 */
export function EmailSignIn() {
  const supabase = createClient();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [step, setStep] = React.useState<"email" | "code">("email");
  const [loading, setLoading] = React.useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Couldn't send code", description: error.message });
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length < 6) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "That code didn't work",
        description: "Check the latest email and try again, or resend a new code.",
      });
      return;
    }
    // Full navigation so the server middleware picks up the new session cookie.
    window.location.assign("/dashboard");
  }

  if (step === "code") {
    return (
      <form onSubmit={verifyCode} className="space-y-2">
        <p className="text-center text-sm text-muted-foreground">
          Enter the 6-digit code we emailed to{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="text-center text-lg tracking-[0.4em]"
          autoFocus
        />
        <Button type="submit" size="lg" className="w-full" disabled={loading || code.replace(/\D/g, "").length < 6}>
          {loading ? "Verifying…" : "Sign in"}
        </Button>
        <div className="flex items-center justify-between text-xs">
          <button type="button" onClick={() => setStep("email")} className="text-muted-foreground hover:underline">
            ← Change email
          </button>
          <button
            type="button"
            onClick={() => sendCode(new Event("submit") as unknown as React.FormEvent)}
            className="text-primary hover:underline"
            disabled={loading}
          >
            Resend code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="space-y-2">
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
        {loading ? "Sending…" : "Email me a sign-in code"}
      </Button>
    </form>
  );
}
