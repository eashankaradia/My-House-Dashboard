"use client";

import * as React from "react";
import { Check, ExternalLink, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Money } from "@/components/shared/money";
import { FREQUENCY_SUFFIX } from "@/lib/constants";
import type { PurchaseOption, PurchaseWithOptions } from "@/lib/database.types";
import { updatePurchaseStatus } from "./actions";

/** The specific option to buy for an item: the chosen one, else the top pick. */
function buyTarget(p: PurchaseWithOptions): PurchaseOption | null {
  const chosen = p.options.find((o) => o.is_chosen);
  if (chosen) return chosen;
  const sorted = [...p.options].sort((a, b) => a.rank - b.rank || Number(a.price) - Number(b.price));
  return sorted[0] ?? null;
}

export function ReadyToBuy({ items }: { items: PurchaseWithOptions[] }) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  if (items.length === 0) return null;

  function markBought(id: string) {
    startTransition(async () => {
      const res = await updatePurchaseStatus(id, "Purchased");
      if (res?.error) toast({ variant: "destructive", title: "Couldn't update", description: res.error });
    });
  }

  return (
    <Card className="border-primary/30 bg-primary/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingCart className="h-4 w-4 text-primary" /> Ready to buy
          <span className="text-xs font-normal text-muted-foreground">{items.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((p) => {
          const opt = buyTarget(p);
          const url = opt?.url ?? p.url ?? null;
          const price = opt ? Number(opt.price) : Number(p.price);
          const chosen = Boolean(p.options.find((o) => o.is_chosen));
          return (
            <div key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-card p-3">
              {opt?.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={opt.image_url} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {opt ? (
                    <>
                      {opt.name}
                      {!chosen ? " · top pick" : null}
                      {opt.store ? ` · ${opt.store}` : ""}
                    </>
                  ) : (
                    p.room ?? p.category
                  )}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold">
                <Money value={price} />
                {opt && FREQUENCY_SUFFIX[opt.frequency] ? (
                  <span className="text-xs font-normal text-muted-foreground">{FREQUENCY_SUFFIX[opt.frequency]}</span>
                ) : null}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                {url ? (
                  <Button asChild size="sm" className="gap-1.5">
                    <a href={url} target="_blank" rel="noreferrer">
                      Buy <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">No link</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => markBought(p.id)}
                  className={cn("gap-1.5")}
                  aria-label={`Mark ${p.name} as bought`}
                >
                  <Check className="h-4 w-4" /> Bought
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
