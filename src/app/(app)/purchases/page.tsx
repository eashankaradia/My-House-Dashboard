import { CheckCircle2, ShoppingBag, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency } from "@/lib/utils";
import { getHouseholdMap } from "@/lib/household";
import type { Purchase, PurchaseOption, PurchaseWithOptions } from "@/lib/database.types";
import { PurchaseForm } from "./purchase-form";
import { PurchasesGrid } from "./purchases-grid";

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
  const [{ data: purchaseData }, { data: optionData }, memberMap] = await Promise.all([
    supabase.from("purchases").select("*").order("created_at", { ascending: false }),
    supabase.from("purchase_options").select("*").order("rank", { ascending: true }),
    getHouseholdMap(),
  ]);

  const options = (optionData ?? []) as PurchaseOption[];
  const purchases: PurchaseWithOptions[] = ((purchaseData ?? []) as Purchase[]).map((p) => ({
    ...p,
    options: options.filter((o) => o.purchase_id === p.id),
  }));

  const wishlist = purchases.filter((p) => p.status !== "Purchased");
  const wishlistValue = wishlist.reduce((s, p) => s + effectivePrice(p), 0);
  const purchased = purchases.filter((p) => p.status === "Purchased");
  const purchasedValue = purchased.reduce((s, p) => s + effectivePrice(p), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Future Purchases" description="A wishlist for everything your home needs." info="Add the thing you want (e.g. a Sofa), then add several Options under it — specific products from different shops with their own prices, links and photos — to compare them side by side. Tap the star to pick your favourite. Use categories, sub-categories and the filter/sort controls to stay organised, and move each item from Considering → Purchased.">
        <PurchaseForm />
      </PageHeader>

      {purchases.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your wishlist is empty"
          description="Save items you're considering — sofas, appliances, decor — with prices, links and priority."
        >
          <PurchaseForm />
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Wishlist items" value={String(wishlist.length)} icon={ShoppingBag} />
            <StatCard label="Wishlist value" value={formatCurrency(wishlistValue)} icon={Wallet} accent="muted" />
            <StatCard label="Purchased" value={formatCurrency(purchasedValue)} hint={`${purchased.length} bought`} icon={CheckCircle2} />
          </div>
          <PurchasesGrid purchases={purchases} memberMap={memberMap} />
        </>
      )}
    </div>
  );
}
