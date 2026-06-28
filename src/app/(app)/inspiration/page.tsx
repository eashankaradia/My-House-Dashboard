import { Lightbulb } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getHouseholdMap } from "@/lib/household";
import type { Collection, Inspiration } from "@/lib/database.types";
import { InspirationForm } from "./inspiration-form";
import { CollectionForm } from "./collection-form";
import { CollectionsStrip } from "./collections-strip";
import { InspirationHub } from "./inspiration-hub";
import { SectionActivityLog } from "@/components/shared/section-activity-log";

export const metadata = { title: "Inspiration" };

export default async function InspirationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: inspoData }, { data: collectionData }, { data: readData }, memberMap] = await Promise.all([
    supabase.from("inspiration").select("*").order("created_at", { ascending: false }),
    supabase.from("collections").select("*").order("name", { ascending: true }),
    supabase.from("comment_reads").select("entity_id").eq("entity_type", "inspiration").eq("user_id", user?.id ?? ""),
    getHouseholdMap(),
  ]);
  const items = (inspoData ?? []) as Inspiration[];
  const collections = (collectionData ?? []) as Collection[];
  const seenIds = ((readData ?? []) as { entity_id: string }[]).map((r) => r.entity_id);

  const countByCollection: Record<string, number> = {};
  for (const i of items) {
    if (i.collection_id) countByCollection[i.collection_id] = (countByCollection[i.collection_id] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Inspiration" description="Your personal board for every home idea." info="Save links and images from Instagram, Pinterest, TikTok and the web. Group them into collections, tag and filter them, and switch between masonry, card and list views. Use the ⋯ menu on any idea to convert it into a Project or a Purchase.">
        <CollectionForm />
        <InspirationForm collections={collections} />
      </PageHeader>

      <CollectionsStrip collections={collections} counts={countByCollection} />

      {items.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No ideas saved yet"
          description="Save links from Instagram, TikTok, Pinterest and more. Organise them into collections and convert the best into projects or purchases."
        >
          <InspirationForm collections={collections} />
        </EmptyState>
      ) : (
        <InspirationHub items={items} collections={collections} seenIds={seenIds} memberMap={memberMap} />
      )}
      <SectionActivityLog entityTypes={["inspiration", "collections"]} />
    </div>
  );
}
