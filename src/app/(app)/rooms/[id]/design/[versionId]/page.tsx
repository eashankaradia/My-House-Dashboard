import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Purchase, PurchaseOption, Room, RoomDesignVersion, RoomLayoutItem } from "@/lib/database.types";
import { FloorPlanner, type WishlistOption } from "../../../floor-planner";

export const metadata = { title: "Floor planner" };

export default async function PlannerPage({
  params,
}: {
  params: Promise<{ id: string; versionId: string }>;
}) {
  const { id, versionId } = await params;
  const supabase = await createClient();
  const [{ data: roomData }, { data: versionData }, { data: itemData }, { data: optionData }, { data: purchaseData }] =
    await Promise.all([
      supabase.from("rooms").select("*").eq("id", id).single(),
      supabase.from("room_design_versions").select("*").eq("id", versionId).single(),
      supabase.from("room_design_layout_items").select("*").eq("version_id", versionId).order("created_at"),
      // Saved purchase options that have a footprint can be dropped onto the plan.
      supabase.from("purchase_options").select("*").not("width_cm", "is", null).not("depth_cm", "is", null),
      supabase.from("purchases").select("id, name").eq("scope", "household"),
    ]);
  const room = roomData as Room | null;
  const version = versionData as RoomDesignVersion | null;
  if (!room || !version) notFound();

  const items = (itemData ?? []) as RoomLayoutItem[];

  const purchaseNames = new Map(
    ((purchaseData ?? []) as Pick<Purchase, "id" | "name">[]).map((p) => [p.id, p.name]),
  );
  const wishlist: WishlistOption[] = ((optionData ?? []) as PurchaseOption[])
    .filter((o) => o.width_cm && o.depth_cm)
    .map((o) => ({
      id: o.id,
      purchase_id: o.purchase_id,
      purchase_name: purchaseNames.get(o.purchase_id) ?? null,
      name: o.name,
      width_cm: Number(o.width_cm),
      depth_cm: Number(o.depth_cm),
      height_cm: o.height_cm != null ? Number(o.height_cm) : null,
      shape: o.shape,
      image_url: o.image_url,
    }));

  return (
    <div className="space-y-4">
      <Link href={`/rooms/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {room.name}
      </Link>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{version.name}</h1>
        <p className="text-sm text-muted-foreground">2D floor plan — drag furniture, tap to edit.</p>
      </div>
      <FloorPlanner room={room} version={version} initialItems={items} wishlist={wishlist} />
    </div>
  );
}
