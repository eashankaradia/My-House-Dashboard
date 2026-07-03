"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import type { PrivatePhoto } from "@/lib/database.types";
import { deletePrivatePhoto, updatePrivatePhotoCaption } from "./actions";

export function PrivatePhotosGrid({ photos, urlById }: { photos: PrivatePhoto[]; urlById: Record<string, string> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();

  function saveCaption(id: string, caption: string) {
    startTransition(async () => {
      const res = await updatePrivatePhotoCaption(id, caption);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't save", description: res.error });
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deletePrivatePhoto(id);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't delete", description: res.error });
      else router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((p) => {
        const url = urlById[p.id];
        return (
          <div key={p.id} className="overflow-hidden rounded-lg border">
            {url ? (
              <a href={url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={p.caption ?? "Private photo"} className="aspect-square w-full object-cover" />
              </a>
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                Unavailable
              </div>
            )}
            <div className="space-y-1 p-2">
              <Input
                defaultValue={p.caption ?? ""}
                placeholder="Add a caption…"
                disabled={pending}
                onBlur={(e) => saveCaption(p.id, e.target.value)}
                className="h-8 text-sm"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{formatDate(p.created_at)}</span>
                <button onClick={() => remove(p.id)} aria-label="Delete photo" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
