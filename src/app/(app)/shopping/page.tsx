import { ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { getHouseholdMap } from "@/lib/household";
import type { ShoppingItem } from "@/lib/database.types";
import { ShoppingList } from "./shopping-list";

export const metadata = { title: "Shopping List" };

export default async function ShoppingPage() {
  const supabase = await createClient();
  const [{ data }, memberMap] = await Promise.all([
    supabase.from("shopping_items").select("*").order("created_at", { ascending: false }),
    getHouseholdMap(),
  ]);
  const items = (data ?? []) as ShoppingItem[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shopping List"
        description="A shared shopping list for the whole household."
        info="Add anything you need to pick up — not just groceries. Tick an item off once you've got it — it drops to the bottom and is struck through. Delete anything you don't need, or clear everything you've already got in one tap."
      />
      <ShoppingList items={items} memberMap={memberMap} />
    </div>
  );
}
