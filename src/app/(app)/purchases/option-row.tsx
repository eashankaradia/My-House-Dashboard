"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, ExternalLink, Pencil, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { StarRating } from "@/components/shared/star-rating";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";
import { FREQUENCY_SUFFIX } from "@/lib/constants";
import type { PurchaseOption } from "@/lib/database.types";
import { OptionForm } from "./option-form";
import { OptionDetailDialog } from "./option-detail";
import { chooseOption, deleteOption, moveOption, setOptionRating } from "./actions";

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

  const priceDrop = option.start_price > 0 && option.price < option.start_price;
  const priceRise = option.start_price > 0 && option.price > option.start_price;

  return (
    <div
      className={cn(
        "w-full min-w-0 space-y-1.5 overflow-hidden rounded-lg border p-2",
        option.is_chosen ? "border-primary/40 bg-primary/5" : "bg-card",
      )}
    >
      {/* Line 1: rank · image · name/meta · price */}
      <div className="flex items-center gap-2">
        <div className="flex shrink-0 flex-col">
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
          <OptionDetailDialog purchaseId={purchaseId} option={option}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={option.image_url} alt="" className="h-10 w-10 shrink-0 cursor-pointer rounded-md object-cover hover:opacity-80" />
          </OptionDetailDialog>
        ) : null}

        <OptionDetailDialog purchaseId={purchaseId} option={option}>
          <button className="block min-w-0 flex-1 rounded text-left hover:underline">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{option.name}</span>
              {option.is_chosen ? <Badge variant="success" className="shrink-0">Picked</Badge> : null}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {[option.store, option.notes].filter(Boolean).join(" · ") || " "}
            </span>
          </button>
        </OptionDetailDialog>

        <div className="flex shrink-0 flex-col items-end">
          <span className="text-sm font-semibold">
            {formatCurrency(option.price)}
            {FREQUENCY_SUFFIX[option.frequency] ? (
              <span className="text-xs font-normal text-muted-foreground">{FREQUENCY_SUFFIX[option.frequency]}</span>
            ) : null}
          </span>
          {priceDrop ? (
            <span className="text-[11px] font-medium text-emerald-600">↓ {formatCurrency(option.start_price - option.price)}</span>
          ) : priceRise ? (
            <span className="text-[11px] font-medium text-rose-600">↑ {formatCurrency(option.price - option.start_price)}</span>
          ) : null}
        </div>
      </div>

      {/* Line 2: rating · actions */}
      <div className="flex items-center justify-between gap-2">
        <StarRating value={option.rating} onRate={(n) => setOptionRating(option.id, n)} size="sm" />
        <div className="flex shrink-0 items-center">
          {option.url ? (
            <a
              href={option.url}
              target="_blank"
              rel="noreferrer"
              aria-label="Open product link"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
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
              <button aria-label="Edit option" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                <Pencil className="h-4 w-4" />
              </button>
            }
          />
          <ConfirmDelete itemLabel="option" action={deleteOption.bind(null, option.id)} />
        </div>
      </div>
    </div>
  );
}
