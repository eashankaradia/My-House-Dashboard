"use client";

import * as React from "react";
import { Download } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import type { Document } from "@/lib/database.types";
import { useOpenFromUrl } from "@/hooks/use-open-from-url";
import { deleteDocument, getDocumentUrl } from "./actions";

export function DocumentDetailDialog({ doc, children }: { doc: Document; children: React.ReactNode }) {
  const { open, onOpenChange } = useOpenFromUrl(doc.id);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function download() {
    startTransition(async () => {
      const res = await getDocumentUrl(doc.id);
      if (res.error || !res.url) {
        toast({ variant: "destructive", title: "Can't open", description: res.error ?? "No file" });
        return;
      }
      window.open(res.url, "_blank");
    });
  }

  const sizeMb = doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {doc.name}
            <Badge variant="secondary">{doc.category}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Expiry / renewal" value={formatDate(doc.expiry_date)} />
            <Detail label="Added" value={formatDate(doc.created_at)} />
            <Detail label="File" value={doc.file_path ? "Attached" : "None"} />
            <Detail label="Size" value={sizeMb} />
          </div>
          {doc.notes ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Notes</p>
              <p className="text-sm">{doc.notes}</p>
            </div>
          ) : null}
          <div className="flex items-center justify-between border-t pt-3">
            {doc.file_path ? (
              <Button variant="outline" size="sm" onClick={download} disabled={pending} className="gap-1.5">
                <Download className="h-4 w-4" /> Open file
              </Button>
            ) : (
              <span />
            )}
            <ConfirmDelete itemLabel="document" action={deleteDocument.bind(null, doc.id)} variant="menu" />
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
