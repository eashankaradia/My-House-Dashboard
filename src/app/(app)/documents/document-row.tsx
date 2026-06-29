"use client";

import * as React from "react";
import { Download, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { useToast } from "@/hooks/use-toast";
import { daysUntil, formatDate } from "@/lib/utils";
import type { Document } from "@/lib/database.types";
import { DocumentDetailDialog } from "./document-detail";
import { deleteDocument, getDocumentUrl } from "./actions";

export function DocumentRow({ doc }: { doc: Document }) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const expiryDays = daysUntil(doc.expiry_date);

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

  return (
    <Card className="shadow-none">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <DocumentDetailDialog doc={doc}>
            <button className="block max-w-full truncate text-left font-medium hover:underline">{doc.name}</button>
          </DocumentDetailDialog>
          <p className="text-xs text-muted-foreground">
            {doc.expiry_date ? `Expires ${formatDate(doc.expiry_date)}` : "No expiry"}
            {doc.file_path ? "" : " · no file"}
          </p>
        </div>

        {expiryDays !== null ? (
          expiryDays < 0 ? (
            <Badge variant="destructive">Expired</Badge>
          ) : expiryDays <= 60 ? (
            <Badge variant="warning">{expiryDays}d left</Badge>
          ) : null
        ) : null}

        <div className="flex items-center gap-1">
          {doc.file_path ? (
            <Button variant="outline" size="sm" onClick={download} disabled={pending}>
              <Download className="h-4 w-4" /> Open
            </Button>
          ) : null}
          <ConfirmDelete itemLabel="document" action={deleteDocument.bind(null, doc.id)} />
        </div>
      </CardContent>
    </Card>
  );
}
