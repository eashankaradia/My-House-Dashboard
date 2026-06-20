import { AlertTriangle, FolderArchive } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { daysUntil } from "@/lib/utils";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import type { Document } from "@/lib/database.types";
import { DocumentForm } from "./document-form";
import { DocumentRow } from "./document-row";

export const metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });
  const documents = (data ?? []) as Document[];

  const expiringSoon = documents.filter((d) => {
    const days = daysUntil(d.expiry_date);
    return days !== null && days >= 0 && days <= 60;
  });

  const grouped = DOCUMENT_CATEGORIES.map((category) => ({
    category,
    docs: documents.filter((d) => d.category === category),
  })).filter((g) => g.docs.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" description="Warranties, insurance, manuals and more — all in one place." info="Upload a file (PDF, image or doc up to 10MB) and tag it with a category. Add an expiry date to get a renewal reminder. Files are stored privately — use Open to view via a secure, short-lived link.">
        <DocumentForm />
      </PageHeader>

      {documents.length === 0 ? (
        <EmptyState
          icon={FolderArchive}
          title="No documents yet"
          description="Upload insurance policies, warranties, manuals and certificates. We'll remind you before anything expires."
        >
          <DocumentForm />
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Stored documents" value={String(documents.length)} icon={FolderArchive} />
            <StatCard
              label="Expiring within 60 days"
              value={String(expiringSoon.length)}
              icon={AlertTriangle}
              accent={expiringSoon.length ? "warning" : "muted"}
            />
          </div>

          <div className="space-y-6">
            {grouped.map(({ category, docs }) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-base">{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {docs.map((doc) => (
                    <DocumentRow key={doc.id} doc={doc} />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
