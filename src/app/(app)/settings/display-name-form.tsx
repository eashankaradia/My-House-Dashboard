"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateDisplayName } from "./actions";

export function DisplayNameForm({ initial }: { initial: string }) {
  const [name, setName] = React.useState(initial);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateDisplayName(name);
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't save", description: res.error });
        return;
      }
      toast({ title: "Display name updated" });
    });
  }

  return (
    <form onSubmit={save} className="flex max-w-sm items-end gap-2">
      <div className="flex-1 space-y-1.5">
        <label htmlFor="display_name" className="text-sm font-medium">
          Your display name
        </label>
        <Input id="display_name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Eashan" />
      </div>
      <Button type="submit" disabled={pending || !name.trim()}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
