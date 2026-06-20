import { CheckCircle2, ShoppingBag, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency } from "@/lib/utils";
import type { Purchase } from "@/lib/database.types";
import { PurchaseForm } from "./purchase-form";
import { PurchasesGrid } from "./purchases-grid";

export const metadata = { title: "Future Purchases" };

export default async function PurchasesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select("*")
    .order("created_at", { ascending: false });
  const purchases = (data ?? []) as Purchase[];

  const wishlist = purchases.filter((p) => p.status !== "Purchased");
  const wishlistValue = wishlist.reduce((s, p) => s + Number(p.price), 0);
  const purchased = purchases.filter((p) => p.status === "Purchased");
  const purchasedValue = purchased.reduce((s, p) => s + Number(p.price), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Future Purchases" description="A wishlist for everything your home needs.">
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
          <PurchasesGrid purchases={purchases} />
        </>
      )}
    </div>
  );
}
