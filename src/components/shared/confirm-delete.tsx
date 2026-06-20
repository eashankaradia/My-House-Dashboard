"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Props = {
  /** Bound server action that performs the delete. */
  action: () => Promise<{ error?: string } | void>;
  itemLabel?: string;
  /** Render a full button instead of the default icon-only trigger. */
  variant?: "icon" | "menu";
  trigger?: React.ReactNode;
};

export function ConfirmDelete({ action, itemLabel = "item", variant = "icon", trigger }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function onConfirm() {
    startTransition(async () => {
      const result = await action();
      if (result && "error" in result && result.error) {
        toast({ variant: "destructive", title: "Couldn't delete", description: result.error });
        return;
      }
      toast({ title: "Deleted", description: `The ${itemLabel} was removed.` });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size={variant === "icon" ? "icon" : "sm"}
            className="text-muted-foreground hover:text-destructive"
            aria-label={`Delete ${itemLabel}`}
          >
            <Trash2 className="h-4 w-4" />
            {variant === "menu" ? <span className="ml-2">Delete</span> : null}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete this {itemLabel}?</DialogTitle>
          <DialogDescription>
            This can&apos;t be undone. The {itemLabel} will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
