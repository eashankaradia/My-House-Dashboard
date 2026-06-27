import Link from "next/link";
import { ArrowRight, FileText, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { formatDate } from "@/lib/utils";
import type { Draft } from "@/lib/database.types";
import { DraftDialog } from "./draft-dialog";
import { deleteDraft } from "./actions";
import { draftMeta } from "./draft-meta";

export const metadata = { title: "Drafts" };

export default async function DraftsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("drafts").select("*").order("created_at", { ascending: false });
  const drafts = (data ?? []) as Draft[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drafts"
        description="Half-formed ideas, saved for later."
        info="Save a draft from the + button (or here), tag it with what it'll become, and pick it up when you're ready. Use 'Continue' to jump to the right section."
      >
        <DraftDialog trigger={<Button className="gap-1.5"><FileText className="h-4 w-4" /> New draft</Button>} />
      </PageHeader>

      {drafts.length === 0 ? (
        <EmptyState icon={FileText} title="No drafts yet" description="Save a half-baked idea and finish it later.">
          <DraftDialog trigger={<Button className="gap-1.5"><FileText className="h-4 w-4" /> New draft</Button>} />
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {drafts.map((d) => {
            const meta = draftMeta(d.kind);
            return (
              <Card key={d.id}>
                <CardContent className="flex items-start gap-3 p-4">
                  {d.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.image_url} alt="" className="h-16 w-16 shrink-0 rounded-lg border object-cover" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{meta.label}</Badge>
                      <span className="truncate font-medium">{d.title}</span>
                    </div>
                    {d.notes ? <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{d.notes}</p> : null}
                    <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(d.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {meta.href ? (
                      <Link href={meta.href} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-primary hover:bg-accent">
                        Continue <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                    <ConfirmDelete itemLabel="draft" action={deleteDraft.bind(null, d.id)} trigger={
                      <button className="rounded-md p-2 text-muted-foreground hover:text-destructive" aria-label="Delete draft"><Trash2 className="h-4 w-4" /></button>
                    } />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
