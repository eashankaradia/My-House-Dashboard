"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { addRoom, removeRoom } from "@/app/(app)/rooms/actions";

export function RoomsSettings({ rooms }: { rooms: string[] }) {
  const [name, setName] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await addRoom(name);
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't add", description: res.error });
        return;
      }
      setName("");
    });
  }

  function remove(room: string) {
    startTransition(async () => {
      const res = await removeRoom(room);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't remove", description: res.error });
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {rooms.map((room) => (
          <span key={room} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm">
            {room}
            <button
              type="button"
              disabled={pending}
              onClick={() => remove(room)}
              aria-label={`Remove ${room}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <form onSubmit={add} className="flex items-center gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a room…" className="h-9 max-w-xs" />
        <Button type="submit" size="sm" className="gap-1.5" disabled={pending || !name.trim()}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>
    </div>
  );
}
