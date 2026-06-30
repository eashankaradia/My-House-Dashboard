"use client";

import * as React from "react";
import { Check, Copy, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createHouseholdInvite, joinHousehold } from "./actions";

export function HouseholdInvite() {
  const { toast } = useToast();
  const [code, setCode] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [generating, startGenerate] = React.useTransition();
  const [joinCode, setJoinCode] = React.useState("");
  const [joining, startJoin] = React.useTransition();

  function generate() {
    startGenerate(async () => {
      const res = await createHouseholdInvite();
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't create invite", description: res.error });
        return;
      }
      setCode(res.code ?? null);
      setCopied(false);
    });
  }

  function copy() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Code copied" });
  }

  function join(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    startJoin(async () => {
      const res = await joinHousehold(joinCode);
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't join", description: res.error });
        return;
      }
      toast({ title: "You've joined the household" });
      setJoinCode("");
    });
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2">
        <p className="text-sm font-medium">Invite someone</p>
        <p className="text-xs text-muted-foreground">
          Generate a code (valid 7 days) and share it with whoever you want to add. They join below.
        </p>
        {code ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg border bg-muted/40 px-3 py-2 text-center text-lg font-semibold tracking-[0.3em]">
              {code}
            </code>
            <Button type="button" variant="outline" size="icon" onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" className="gap-2" disabled={generating} onClick={generate}>
            <UserPlus className="h-4 w-4" />
            {generating ? "Generating…" : "Generate invite code"}
          </Button>
        )}
      </div>

      <form onSubmit={join} className="space-y-2">
        <p className="text-sm font-medium">Join a household</p>
        <p className="text-xs text-muted-foreground">Got a code from someone? Enter it to join their household.</p>
        <div className="flex items-center gap-2">
          <Input
            placeholder="ABC123"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="text-center tracking-[0.2em]"
            maxLength={6}
          />
          <Button type="submit" disabled={joining || !joinCode.trim()}>
            {joining ? "Joining…" : "Join"}
          </Button>
        </div>
      </form>
    </div>
  );
}
