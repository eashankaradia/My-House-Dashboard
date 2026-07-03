"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Share } from "@/lib/database.types";
import { ShareForm } from "./share-form";

export function SharesSection({ shares, prices }: { shares: Share[]; prices: Record<string, number | null> }) {
  return (
    <div className="space-y-1.5">
      {shares.map((share) => {
        const live = prices[share.ticker] ?? null;
        const costBasis = Number(share.quantity) * Number(share.purchase_price);
        const currentValue = Number(share.quantity) * (live ?? Number(share.purchase_price));
        const gain = currentValue - costBasis;
        const gainPct = costBasis > 0 ? (gain / costBasis) * 100 : 0;

        return (
          <ShareForm
            key={share.id}
            share={share}
            trigger={
              <button className="flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {share.ticker}
                    {live == null && (
                      <Badge variant="outline" className="ml-1.5 text-[10px]">
                        price unavailable
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {share.quantity} @ {formatCurrency(Number(share.purchase_price))}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold">{formatCurrency(currentValue)}</p>
                  {live != null && (
                    <p className={`flex items-center justify-end gap-0.5 text-xs ${gain >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                      {gain >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {gain >= 0 ? "+" : ""}
                      {formatCurrency(gain)} ({gainPct >= 0 ? "+" : ""}
                      {gainPct.toFixed(1)}%)
                    </p>
                  )}
                </div>
              </button>
            }
          />
        );
      })}
    </div>
  );
}
