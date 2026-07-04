"use client";

import * as React from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { useToast } from "@/hooks/use-toast";
import { PURCHASE_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { PurchaseWithOptions } from "@/lib/database.types";
import { updatePurchaseStatus } from "./actions";

/** Quick status change — used in list rows and the item detail dialog alike. */
export function StatusSelect({ purchase, className }: { purchase: PurchaseWithOptions; className?: string }) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  return (
    <NativeSelect
      value={purchase.status}
      disabled={pending}
      onChange={(e) =>
        startTransition(async () => {
          const res = await updatePurchaseStatus(purchase.id, e.target.value);
          if (res?.error) toast({ variant: "destructive", title: "Couldn't update", description: res.error });
        })
      }
      className={cn("h-8 text-xs", className)}
    >
      {PURCHASE_STATUSES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </NativeSelect>
  );
}
