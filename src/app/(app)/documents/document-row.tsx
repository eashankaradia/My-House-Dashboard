"use client";

import * as React from "react";
import { Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { ListRow } from "@/components/shared/list-row";
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
    <ListRow
      icon={
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </span>
      }
      title={
        <DocumentDetailDialog doc={doc}>
          <button className="max-w-full truncate text-left hover:underline">{doc.name}</button>
        </DocumentDetailDialog>
      }
      meta={
        <>
          {doc.expiry_date ? `Expires ${formatDate(doc.expiry_date)}` : "No expiry"}
          {doc.file_path ? "" : " · no file"}
        </>
      }
      badges={
        <>
          <Badge variant="secondary">{doc.category}</Badge>
          {expiryDays !== null ? (
            expiryDays < 0 ? (
              <Badge variant="destructive">Expired</Badge>
            ) : expiryDays <= 60 ? (
              <Badge variant="warning">{expiryDays}d left</Badge>
            ) : null
          ) : null}
        </>
      }
      actions={
        <>
          {doc.file_path ? (
            <Button variant="outline" size="sm" onClick={download} disabled={pending}>
              <Download className="h-4 w-4" /> Open
            </Button>
          ) : null}
          <ConfirmDelete itemLabel="document" action={deleteDocument.bind(null, doc.id)} />
        </>
      }
    />
  );
}
