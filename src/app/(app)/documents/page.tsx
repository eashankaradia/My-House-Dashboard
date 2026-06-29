import { AlertTriangle, FolderArchive } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { daysUntil } from "@/lib/utils";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import type { Document } from "@/lib/database.types";
import { DocumentForm } from "./document-form";
import { DocumentRow } from "./document-row";
import { SectionActivityLog } from "@/components/shared/section-activity-log";

export const metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("*")
    .neq("category", "Note")
    .order("created_at", { ascending: false });
  const documents = (data ?? []) as Document[];

  const expiringSoon = documents.filter((d) => {
    const days = daysUntil(d.expiry_date);
    return days !== null && days >= 0 && days <= 60;
  });

  const grouped = DOCUMENT_CATEGORIES.filter((c) => c !== "Note")
    .map((category) => ({
      category,
      docs: documents.filter((d) => d.category === category),
    }))
    .filter((g) => g.docs.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" description="Warranties, insurance, manuals, certificates and more — all in one place." info="Upload a file (PDF, image or doc up to 10MB) and tag it with a category. Add an expiry date to get a renewal reminder. Files are stored privately — use Open to view via a secure, short-lived link. Quick notes and useful links now live under Notes & links.">
        <DocumentForm />
      </PageHeader>

      {documents.length === 0 ? (
        <EmptyState
          icon={FolderArchive}
          title="Nothing here yet"
          description="Upload insurance policies, warranties, manuals and certificates to keep them safe and searchable."
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

          <div className="space-y-4">
            {grouped.map(({ category, docs }) => (
              <section key={category}>
                {/* Sticky section header (pins under the top bar while scrolling). */}
                <div className="sticky top-16 z-10 -mx-1 mb-2 flex items-center gap-2 bg-background/90 px-1 py-1.5 backdrop-blur">
                  <h2 className="text-sm font-semibold">{category}</h2>
                  <span className="text-xs text-muted-foreground">{docs.length}</span>
                </div>
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <DocumentRow key={doc.id} doc={doc} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
      <SectionActivityLog entityTypes={["documents"]} />
    </div>
  );
}
