"use client";

import * as React from "react";
import { BellPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { listOtherMembers, sendNotification } from "@/app/(app)/notifications/actions";

/**
 * "Point out" an item to another household member — sends them a notification
 * that links straight back to this item.
 */
export function PointOutButton({ label, href }: { label: string; href: string }) {
  const [open, setOpen] = React.useState(false);
  const [members, setMembers] = React.useState<{ id: string; name: string }[]>([]);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  React.useEffect(() => {
    if (open) listOtherMembers().then(setMembers);
  }, [open]);

  function point(member: { id: string; name: string }) {
    startTransition(async () => {
      const res = await sendNotification(member.id, `Take a look: ${label}`, undefined, href);
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't notify", description: res.error });
        return;
      }
      toast({ title: `Pointed out to ${member.name}` });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Point out to someone"
          title="Point out to someone"
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <BellPlus className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Point this out</DialogTitle>
          <DialogDescription>Send a household member a notification linking to “{label}”.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          {members.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">No one else in your household yet.</p>
          ) : (
            members.map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={pending}
                onClick={() => point(m)}
                className="flex w-full items-center rounded-md border px-3 py-2.5 text-sm transition-colors hover:bg-accent"
              >
                {m.name}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
