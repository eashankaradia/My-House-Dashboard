import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Room, RoomDesignVersion, RoomLayoutItem } from "@/lib/database.types";
import { FloorPlanner } from "../../../floor-planner";

export const metadata = { title: "Floor planner" };

export default async function PlannerPage({
  params,
}: {
  params: Promise<{ id: string; versionId: string }>;
}) {
  const { id, versionId } = await params;
  const supabase = await createClient();
  const [{ data: roomData }, { data: versionData }, { data: itemData }] = await Promise.all([
    supabase.from("rooms").select("*").eq("id", id).single(),
    supabase.from("room_design_versions").select("*").eq("id", versionId).single(),
    supabase.from("room_design_layout_items").select("*").eq("version_id", versionId).order("created_at"),
  ]);
  const room = roomData as Room | null;
  const version = versionData as RoomDesignVersion | null;
  if (!room || !version) notFound();

  const items = (itemData ?? []) as RoomLayoutItem[];

  return (
    <div className="space-y-4">
      <Link href={`/rooms/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {room.name}
      </Link>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{version.name}</h1>
        <p className="text-sm text-muted-foreground">2D floor plan — drag furniture, tap to edit.</p>
      </div>
      <FloorPlanner room={room} version={version} initialItems={items} />
    </div>
  );
}
