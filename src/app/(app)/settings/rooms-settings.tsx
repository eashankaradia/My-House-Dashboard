"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { addRoom, removeRoom, renameRoom } from "@/app/(app)/rooms/actions";

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

  function rename(oldName: string, newName: string) {
    if (newName.trim() === oldName || !newName.trim()) return;
    startTransition(async () => {
      const res = await renameRoom(oldName, newName);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't rename", description: res.error });
      else toast({ title: "Room renamed" });
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {rooms.map((room) => (
          <div key={room} className="flex items-center gap-2">
            <Input
              defaultValue={room}
              disabled={pending}
              onBlur={(e) => rename(room, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="h-9 flex-1"
              aria-label={`Rename ${room}`}
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => remove(room)}
              aria-label={`Remove ${room}`}
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Tap a name to rename it. Renaming keeps its tagged purchases and ideas linked.</p>
      <form onSubmit={add} className="flex items-center gap-2 border-t pt-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a room…" className="h-9 max-w-xs" />
        <Button type="submit" size="sm" className="gap-1.5" disabled={pending || !name.trim()}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>
    </div>
  );
}
