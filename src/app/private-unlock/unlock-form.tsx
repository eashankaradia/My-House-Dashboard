"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { unlockPrivate } from "./actions";

export function UnlockForm({ next }: { next: string }) {
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("password", password);
      formData.set("next", next);
      const res = await unlockPrivate(formData);
      if (res?.error) {
        setError(res.error);
        setPassword("");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="pl-9"
          autoFocus
          autoComplete="off"
        />
      </div>
      {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending || !password}>
        {pending ? "Unlocking…" : "Unlock"}
      </Button>
    </form>
  );
}
