"use client";

import * as React from "react";
import { ExternalLink, Hammer, ShoppingBag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { ShareButton } from "@/components/shared/share-button";
import { ItemTimestamps } from "@/components/shared/item-timestamps";
import { useToast } from "@/hooks/use-toast";
import { priorityVariant } from "@/lib/ui";
import type { Collection, Inspiration } from "@/lib/database.types";
import { useOpenFromUrl } from "@/hooks/use-open-from-url";
import { LinkedItems } from "@/app/(app)/links/linked-items";
import { InspirationForm } from "./inspiration-form";
import { convertInspiration, deleteInspiration } from "./actions";
import { SocialEmbed } from "./social-embed";

export function InspirationDetailDialog({
  item,
  collections,
  children,
}: {
  item: Inspiration;
  collections: Collection[];
  children: React.ReactNode;
}) {
  const { open, onOpenChange } = useOpenFromUrl(item.id);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function convert(target: "project" | "purchase") {
    startTransition(async () => {
      const res = await convertInspiration(item.id, target);
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't convert", description: res.error });
        return;
      }
      toast({ title: target === "project" ? "Added to Projects" : "Added to Purchases" });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{item.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {item.link ? (
            <SocialEmbed link={item.link} title={item.title} />
          ) : item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt={item.title} className="max-h-64 w-full rounded-lg object-cover" />
          ) : null}

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{item.source}</Badge>
            {item.category ? <Badge variant="outline">{item.category}</Badge> : null}
            {item.room ? <Badge variant="outline">{item.room}</Badge> : null}
            <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge>
            <Badge variant="secondary">{item.status}</Badge>
          </div>

          {item.tags?.length ? (
            <p className="text-sm text-muted-foreground">{item.tags.map((t) => `#${t}`).join(" ")}</p>
          ) : null}
          {item.notes ? <p className="text-sm">{item.notes}</p> : null}
          {item.link ? (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Open link <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
          <ItemTimestamps createdAt={item.created_at} updatedAt={item.updated_at} />

          <div className="border-t pt-3">
            <LinkedItems type="inspiration" id={item.id} />
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <Button variant="outline" size="sm" onClick={() => convert("project")} disabled={pending} className="gap-1.5">
              <Hammer className="h-4 w-4" /> To project
            </Button>
            <Button variant="outline" size="sm" onClick={() => convert("purchase")} disabled={pending} className="gap-1.5">
              <ShoppingBag className="h-4 w-4" /> To purchase
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <ShareButton title={item.title} text={item.notes ?? item.link ?? undefined} />
              <InspirationForm inspiration={item} collections={collections} />
              <ConfirmDelete itemLabel="idea" action={deleteInspiration.bind(null, item.id)} variant="menu" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
