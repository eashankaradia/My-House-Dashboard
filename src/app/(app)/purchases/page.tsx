import { ShoppingBag, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency } from "@/lib/utils";
import { getHouseholdMap } from "@/lib/household";
import { ArchivedSection } from "@/components/shared/archived-section";
import type { Purchase, PurchaseOption, PurchaseWithOptions } from "@/lib/database.types";
import { PurchaseForm } from "./purchase-form";
import { PurchasesGrid } from "./purchases-grid";
import { deletePurchase, restorePurchase } from "./actions";
import { SectionActivityLog } from "@/components/shared/section-activity-log";

export const metadata = { title: "Future Purchases" };

/** Best-estimate price for an item: chosen option → cheapest option → item price. */
function effectivePrice(p: PurchaseWithOptions): number {
  const chosen = p.options.find((o) => o.is_chosen);
  if (chosen) return Number(chosen.price);
  if (p.options.length) return Math.min(...p.options.map((o) => Number(o.price)));
  return Number(p.price);
}

export default async function PurchasesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: purchaseData }, { data: optionData }, memberMap] = await Promise.all([
    supabase.from("purchases").select("*").order("created_at", { ascending: false }),
    supabase.from("purchase_options").select("*").order("rank", { ascending: true }),
    getHouseholdMap(),
  ]);

  const options = (optionData ?? []) as PurchaseOption[];
  const allPurchases: PurchaseWithOptions[] = ((purchaseData ?? []) as Purchase[]).map((p) => ({
    ...p,
    options: options.filter((o) => o.purchase_id === p.id),
  }));
  const purchases = allPurchases.filter((p) => !p.archived_at);
  const archived = allPurchases.filter((p) => p.archived_at);

  const wishlist = purchases.filter((p) => p.status !== "Purchased");
  const readyToBuy = purchases.filter((p) => p.status === "Ready To Buy");
  const readyToBuyValue = readyToBuy.reduce((s, p) => s + effectivePrice(p), 0);
  const members = Object.entries(memberMap).map(([id, name]) => ({ id, name }));

  return (
    <div className="space-y-6">
      <PageHeader title="Future Purchases" description="A wishlist for everything your home needs." info="Add the thing you want (e.g. a Sofa), then add several Options under it — specific products from different shops with their own prices, links and photos — to compare them side by side. Give items and options an out-of-5 star rating, then filter and sort by it. The card view keeps your top-rated item open and the rest collapsed.">
        <PurchaseForm members={members} />
      </PageHeader>

      {purchases.length === 0 && archived.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your wishlist is empty"
          description="Save items you're considering — sofas, appliances, decor — with prices, links and priority."
        >
          <PurchaseForm members={members} />
        </EmptyState>
      ) : (
        <>
          {purchases.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <StatCard label="Wishlist items" value={String(wishlist.length)} icon={ShoppingBag} />
                <StatCard label="Ready to buy" value={formatCurrency(readyToBuyValue)} hint={`${readyToBuy.length} item${readyToBuy.length === 1 ? "" : "s"}`} icon={Wallet} />
              </div>
              <PurchasesGrid purchases={purchases} memberMap={memberMap} currentUserId={user?.id} />
            </>
          ) : null}
          <ArchivedSection
            items={archived.map((p) => ({ id: p.id, label: p.name }))}
            noun="items"
            onRestore={restorePurchase}
            onDelete={deletePurchase}
          />
        </>
      )}
      <SectionActivityLog entityTypes={["purchases", "purchase_options", "purchase_stars"]} />
    </div>
  );
}
