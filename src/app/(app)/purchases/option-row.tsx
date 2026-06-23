"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, ExternalLink, Pencil, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";
import type { PurchaseOption } from "@/lib/database.types";
import { OptionForm } from "./option-form";
import { chooseOption, deleteOption, moveOption } from "./actions";

export function OptionRow({
  purchaseId,
  option,
  isFirst,
  isLast,
}: {
  purchaseId: string;
  option: PurchaseOption;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function run(fn: () => Promise<{ error?: string } | void>) {
    startTransition(async () => {
      const res = await fn();
      if (res?.error) toast({ variant: "destructive", title: "Couldn't update", description: res.error });
    });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border p-2",
        option.is_chosen ? "border-primary/40 bg-primary/5" : "bg-card",
      )}
    >
      <div className="flex flex-col">
        <button
          onClick={() => run(() => moveOption(purchaseId, option.id, "up"))}
          disabled={pending || isFirst}
          aria-label="Rank higher"
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          onClick={() => run(() => moveOption(purchaseId, option.id, "down"))}
          disabled={pending || isLast}
          aria-label="Rank lower"
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {option.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={option.image_url} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{option.name}</p>
          {option.is_chosen ? <Badge variant="success">Picked</Badge> : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {[option.store, option.notes].filter(Boolean).join(" · ") || " "}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-sm font-semibold">{formatCurrency(option.price)}</span>
        {option.start_price > 0 && option.price < option.start_price ? (
          <span className="text-[11px] font-medium text-emerald-600">
            ↓ {formatCurrency(option.start_price - option.price)}
          </span>
        ) : option.start_price > 0 && option.price > option.start_price ? (
          <span className="text-[11px] font-medium text-rose-600">
            ↑ {formatCurrency(option.price - option.start_price)}
          </span>
        ) : null}
        {option.url ? (
          <a
            href={option.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-[11px] text-primary hover:underline"
          >
            View <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center">
        <button
          onClick={() => run(() => chooseOption(purchaseId, option.id))}
          disabled={pending}
          aria-label={option.is_chosen ? "Chosen option" : "Pick this option"}
          className={cn(
            "rounded-md p-1.5 transition-colors hover:bg-accent",
            option.is_chosen ? "text-amber-500" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Star className={cn("h-4 w-4", option.is_chosen && "fill-amber-500")} />
        </button>
        <OptionForm
          purchaseId={purchaseId}
          option={option}
          trigger={
            <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Edit option">
              <Pencil className="h-4 w-4" />
            </button>
          }
        />
        <ConfirmDelete itemLabel="option" action={deleteOption.bind(null, option.id)} />
      </div>
    </div>
  );
}
