"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import type { QuickPhoto } from "@/lib/database.types";
import { deleteQuickPhoto, updateQuickPhoto } from "./actions";

export function PhotosGrid({ photos }: { photos: QuickPhoto[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();

  function saveLabel(id: string, label: string) {
    startTransition(async () => {
      const res = await updateQuickPhoto(id, label);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't save", description: res.error });
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteQuickPhoto(id);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't delete", description: res.error });
      else router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((p) => (
        <div key={p.id} className="overflow-hidden rounded-lg border">
          <a href={p.image_url} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image_url} alt={p.label ?? "Photo"} className="aspect-square w-full object-cover" />
          </a>
          <div className="space-y-1 p-2">
            <Input
              defaultValue={p.label ?? ""}
              placeholder="Add a label…"
              disabled={pending}
              onBlur={(e) => saveLabel(p.id, e.target.value)}
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
      ))}
    </div>
  );
}
