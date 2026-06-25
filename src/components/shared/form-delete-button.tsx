"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/**
 * Trash button for an item's edit form. Runs the delete action and reports
 * errors; the parent passes an onDelete that also closes the dialog on success.
 */
export function FormDeleteButton({
  onDelete,
  label = "Delete",
}: {
  onDelete: () => Promise<{ error?: string } | void>;
  label?: string;
}) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-destructive"
      disabled={pending}
      aria-label={label}
      title={label}
      onClick={() =>
        startTransition(async () => {
          const res = await onDelete();
          if (res && "error" in res && res.error) {
            toast({ variant: "destructive", title: "Couldn't delete", description: res.error });
          }
        })
      }
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
