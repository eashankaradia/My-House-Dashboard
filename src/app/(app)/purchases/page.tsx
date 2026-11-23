import { ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PURCHASE_CATEGORIES } from "@/lib/constants";
import { getHouseholdMap } from "@/lib/household";
import { ArchivedSection } from "@/components/shared/archived-section";
import type { Purchase, PurchaseCategoryRow, PurchaseOption, PurchaseWithOptions } from "@/lib/database.types";
import { PurchaseForm } from "./purchase-form";
import { PurchasesGrid } from "./purchases-grid";
import { deletePurchase, restorePurchase } from "./actions";
import { PriceRefresh } from "./price-refresh";

export const metadata = { title: "Future Purchases" };

export default async function PurchasesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isHouse = process.env.NEXT_PUBLIC_APP !== "life";
  let purchasesQuery = supabase.from("purchases").select("*").order("created_at", { ascending: false });
  if (isHouse) purchasesQuery = purchasesQuery.eq("scope", "household");

  const [{ data: purchaseData }, { data: optionData }, { data: categoryData }, memberMap] = await Promise.all([
    purchasesQuery,
    supabase.from("purchase_options").select("*").order("rank", { ascending: true }),
    supabase.from("purchase_categories").select("*").order("name"),
    getHouseholdMap(),
  ]);

  const options = (optionData ?? []) as PurchaseOption[];
  const allPurchases: PurchaseWithOptions[] = ((purchaseData ?? []) as Purchase[]).map((p) => ({
    ...p,
    options: options.filter((o) => o.purchase_id === p.id),
  }));
  const purchases = allPurchases.filter((p) => !p.archived_at);
  const archived = allPurchases.filter((p) => p.archived_at);
  const categoryRows = (categoryData ?? []) as PurchaseCategoryRow[];
  const categories = Array.from(new Set([...PURCHASE_CATEGORIES, ...categoryRows.map((c) => c.name), ...allPurchases.map((p) => p.category)])).sort();

  const members = Object.entries(memberMap).map(([id, name]) => ({ id, name }));

  return (
    <div className="space-y-6">
      <PriceRefresh />
      <PageHeader title="Future Purchases" description="A wishlist for everything your home needs." info="Add the thing you want (e.g. a Sofa), then add several Options under it — specific products from different shops with their own prices, links and photos — to compare them side by side. The list groups into a collapsible section per room, each with a running total; tap any item to open it and change status, edit it, or work through its options. The two icons on the right switch between by-room and a flat list, and the Filters button covers status, room, rating and essentials.">
        <PurchaseForm members={members} categories={categories} />
      </PageHeader>

      {purchases.length === 0 && archived.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your wishlist is empty"
          description="Save items you're considering — sofas, appliances, decor — with prices, links and priority."
        >
          <PurchaseForm members={members} categories={categories} />
        </EmptyState>
      ) : (
        <>
          {purchases.length > 0 ? (
            <PurchasesGrid purchases={purchases} memberMap={memberMap} currentUserId={user?.id} categories={categories} />
          ) : null}
          <ArchivedSection
            items={archived.map((p) => ({ id: p.id, label: p.name }))}
            noun="items"
            onRestore={restorePurchase}
            onDelete={deletePurchase}
          />
        </>
      )}
    </div>
  );
}
