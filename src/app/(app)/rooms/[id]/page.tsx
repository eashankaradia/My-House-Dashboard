import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type {
  Inspiration,
  Project,
  Purchase,
  PurchaseOption,
  Room,
  RoomColourPalette,
  RoomColourSwatch,
  RoomDesignVersion,
  RoomLayoutItem,
} from "@/lib/database.types";
import { RoomWorkspace } from "../room-workspace";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("rooms").select("name").eq("id", id).single();
  return { title: (data as { name?: string } | null)?.name ?? "Room" };
}

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: roomData } = await supabase.from("rooms").select("*").eq("id", id).single();
  const room = roomData as Room | null;
  if (!room) notFound();

  const [
    { data: versionData },
    { data: purchaseData },
    { data: optionData },
    { data: layoutData },
    { data: inspoData },
    { data: projectData },
    { data: paletteData },
    { data: swatchData },
  ] =
    await Promise.all([
      supabase.from("room_design_versions").select("*").eq("room_id", id).order("created_at", { ascending: true }),
      supabase.from("purchases").select("*").eq("room", room.name).is("archived_at", null).eq("scope", "household"),
      supabase.from("purchase_options").select("*").order("rank", { ascending: true }),
      supabase.from("room_design_layout_items").select("*"),
      supabase.from("inspiration").select("*").eq("room", room.name),
      supabase.from("projects").select("id, name").is("archived_at", null).order("name"),
      supabase.from("room_colour_palettes").select("*").eq("room_id", id).order("created_at"),
      supabase.from("room_colour_swatches").select("*").order("position"),
    ]);

  const versions = (versionData ?? []) as RoomDesignVersion[];
  const purchases = (purchaseData ?? []) as Purchase[];
  const versionIds = new Set(versions.map((v) => v.id));
  const purchaseIds = new Set(purchases.map((p) => p.id));
  const options = ((optionData ?? []) as PurchaseOption[]).filter((o) => purchaseIds.has(o.purchase_id));
  const layoutItems = ((layoutData ?? []) as RoomLayoutItem[]).filter((item) => versionIds.has(item.version_id));
  const inspiration = (inspoData ?? []) as Inspiration[];
  const projects = (projectData ?? []) as Pick<Project, "id" | "name">[];
  const palettes = (paletteData ?? []) as RoomColourPalette[];
  const paletteIds = new Set(palettes.map((p) => p.id));
  const swatches = ((swatchData ?? []) as RoomColourSwatch[]).filter((s) => paletteIds.has(s.palette_id));

  return (
    <div className="space-y-4">
      <Link href="/rooms" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All rooms
      </Link>
      <RoomWorkspace
        room={room}
        versions={versions}
        purchases={purchases}
        options={options}
        layoutItems={layoutItems}
        inspiration={inspiration}
        projects={projects}
        palettes={palettes}
        swatches={swatches}
      />
    </div>
  );
}
