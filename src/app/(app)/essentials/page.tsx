import { ListChecks } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { Essential } from "@/lib/database.types";
import { EssentialsView } from "./essentials-view";
import { EssentialForm } from "./essential-form";

export const metadata = { title: "Essentials" };

export default async function EssentialsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("essentials")
    .select("*")
    .order("category", { ascending: true })
    .order("order_index", { ascending: true });

  const items = (data ?? []) as Essential[];
  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Essentials"
        description="What you need, grouped by category — and what you've already got."
        info="RAG status: green = sorted, amber = have it but not great, red = still need it."
      >
        <EssentialForm categories={categories} />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No essentials yet"
          description="Add the things you need to be at your best — work kit, clothing, consumables, anything — grouped by category, with a RAG status and what you currently have."
        >
          <EssentialForm categories={categories} />
        </EmptyState>
      ) : (
        <EssentialsView items={items} />
      )}
    </div>
  );
}
