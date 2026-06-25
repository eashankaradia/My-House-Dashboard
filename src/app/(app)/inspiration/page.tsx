import { Lightbulb, FolderArchive } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import type { Collection, Inspiration } from "@/lib/database.types";
import { InspirationForm } from "./inspiration-form";
import { CollectionForm } from "./collection-form";
import { InspirationHub } from "./inspiration-hub";
import { SectionActivityLog } from "@/components/shared/section-activity-log";
import { deleteCollection } from "./actions";

export const metadata = { title: "Inspiration" };

export default async function InspirationPage() {
  const supabase = await createClient();
  const [{ data: inspoData }, { data: collectionData }] = await Promise.all([
    supabase.from("inspiration").select("*").order("created_at", { ascending: false }),
    supabase.from("collections").select("*").order("name", { ascending: true }),
  ]);
  const items = (inspoData ?? []) as Inspiration[];
  const collections = (collectionData ?? []) as Collection[];

  const countByCollection = new Map<string, number>();
  for (const i of items) {
    if (i.collection_id) countByCollection.set(i.collection_id, (countByCollection.get(i.collection_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Inspiration" description="Your personal board for every home idea." info="Save links and images from Instagram, Pinterest, TikTok and the web. Group them into collections, tag and filter them, and switch between masonry, card and list views. Use the ⋯ menu on any idea to convert it into a Project or a Purchase.">
        <CollectionForm />
        <InspirationForm collections={collections} />
      </PageHeader>

      {collections.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {collections.map((c) => (
            <div
              key={c.id}
              className="group flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm"
            >
              <FolderArchive className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{c.name}</span>
              <Badge variant="secondary">{countByCollection.get(c.id) ?? 0}</Badge>
              <ConfirmDelete
                itemLabel="collection"
                action={deleteCollection.bind(null, c.id)}
                trigger={
                  <button className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100">
                    ✕
                  </button>
                }
              />
            </div>
          ))}
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No ideas saved yet"
          description="Save links from Instagram, TikTok, Pinterest and more. Organise them into collections and convert the best into projects or purchases."
        >
          <InspirationForm collections={collections} />
        </EmptyState>
      ) : (
        <InspirationHub items={items} collections={collections} />
      )}
      <SectionActivityLog entityTypes={["inspiration", "collections"]} />
    </div>
  );
}
