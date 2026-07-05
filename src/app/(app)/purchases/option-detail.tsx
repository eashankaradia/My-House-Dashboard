"use client";

import * as React from "react";
import { ExternalLink, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/shared/star-rating";
import { ItemComments } from "@/components/shared/item-comments";
import { ShareButton } from "@/components/shared/share-button";
import { useOpenFromUrl } from "@/hooks/use-open-from-url";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { FREQUENCY_SUFFIX, OPTION_SHAPE_LABELS } from "@/lib/constants";
import type { PurchaseOption } from "@/lib/database.types";
import { OptionForm } from "./option-form";

/** Read-only view of a single option — click an option to see its details. */
export function OptionDetailDialog({
  purchaseId,
  purchaseCategory = "Furniture",
  option,
  deepLink = true,
  children,
}: {
  purchaseId: string;
  purchaseCategory?: string;
  option: PurchaseOption;
  /**
   * React to `?option=<id>` in the URL (e.g. from a shared link) and open
   * automatically. Disabled for duplicate render paths (the grid's inline
   * option list) so only one instance per option auto-opens.
   */
  deepLink?: boolean;
  /** One or more `<DialogTrigger asChild>` elements. */
  children: React.ReactNode;
}) {
  const linked = useOpenFromUrl(option.id, "option");
  const [localOpen, setLocalOpen] = React.useState(false);
  const open = deepLink ? linked.open : localOpen;
  const onOpenChange = deepLink ? linked.onOpenChange : setLocalOpen;
  const [activePhoto, setActivePhoto] = React.useState(0);
  const dims = [option.width_cm, option.depth_cm, option.height_cm];
  const hasDims = dims.some((d) => d != null && d > 0);
  const isFurniture = purchaseCategory === "Furniture";
  const photos = option.image_urls?.length ? option.image_urls : option.image_url ? [option.image_url] : [];

  React.useEffect(() => {
    if (open) setActivePhoto(0);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6">
            <span className="min-w-0 break-words">{option.name}</span>
            {option.is_chosen ? <Badge variant="success">Picked</Badge> : null}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {photos.length ? (
            <div className="space-y-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[Math.min(activePhoto, photos.length - 1)]}
                alt=""
                className="max-h-56 w-full rounded-lg object-cover"
              />
              {photos.length > 1 ? (
                <div className="flex gap-1.5 overflow-x-auto">
                  {photos.map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActivePhoto(i)}
                      aria-label={`Photo ${i + 1}`}
                      className={cn(
                        "h-12 w-12 shrink-0 overflow-hidden rounded-md border-2",
                        i === activePhoto ? "border-primary" : "border-transparent",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xl font-semibold">
              {formatCurrency(option.price)}
              {FREQUENCY_SUFFIX[option.frequency] ? (
                <span className="text-sm font-normal text-muted-foreground">{FREQUENCY_SUFFIX[option.frequency]}</span>
              ) : null}
            </span>
            <StarRating value={option.rating} size="sm" />
          </div>

          {option.start_price > 0 && Number(option.price) !== Number(option.start_price) ? (
            <p className="text-xs text-muted-foreground">
              Started at {formatCurrency(option.start_price)} ·{" "}
              {option.price < option.start_price ? (
                <span className="font-medium text-emerald-600">down {formatCurrency(option.start_price - option.price)}</span>
              ) : (
                <span className="font-medium text-rose-600">up {formatCurrency(option.price - option.start_price)}</span>
              )}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {option.store ? <Detail label="Store" value={option.store} /> : null}
            {isFurniture && option.shape ? <Detail label="Shape" value={OPTION_SHAPE_LABELS[option.shape] ?? option.shape} /> : null}
            {isFurniture && hasDims ? (
              <Detail
                label="Size (W×D×H cm)"
                value={dims.map((d) => (d != null && d > 0 ? d : "—")).join(" × ")}
              />
            ) : null}
          </div>

          {option.notes ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Notes</p>
              <p className="whitespace-pre-wrap text-sm">{option.notes}</p>
            </div>
          ) : null}

          <p className="text-[11px] text-muted-foreground">
            Added {formatDate(option.created_at)} · updated {formatDate(option.updated_at)}
          </p>

          <div className="border-t pt-3">
            <ItemComments
              entityType="purchase_option"
              entityId={option.id}
              ownerId={option.user_id}
              href={`/purchases?item=${option.purchase_id}&option=${option.id}`}
              label={option.name}
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-3">
            {option.url ? (
              <a
                href={option.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View product <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
            <ShareButton
              title={option.name}
              text={[option.store, formatCurrency(option.price)].filter(Boolean).join(" · ")}
              url={`/purchases?item=${option.purchase_id}&option=${option.id}`}
            />
            <OptionForm
              purchaseId={purchaseId}
              purchaseCategory={purchaseCategory}
              option={option}
              trigger={
                <Button variant="outline" size="icon" aria-label="Edit option">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
