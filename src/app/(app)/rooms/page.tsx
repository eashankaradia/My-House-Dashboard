import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import type { Inspiration, Purchase, RoomDesignVersion } from "@/lib/database.types";
import { getRoomEntities } from "./actions";
import { RoomsGrid, type RoomSummary } from "./rooms-grid";

export const metadata = { title: "Room Designer" };

function dims(w: number | null, l: number | null) {
  if (!w || !l) return null;
  return `${(w / 100).toFixed(2)}m x ${(l / 100).toFixed(2)}m`;
}

function activityScore(
  roomName: string,
  roomId: string,
  versions: Pick<RoomDesignVersion, "room_id" | "is_final" | "status">[],
  purchases: Pick<Purchase, "room" | "status">[],
) {
  const activeVersions = versions.filter((v) => v.room_id === roomId && !v.is_final && v.status !== "archived").length;
  const activeItems = purchases.filter((p) => p.room === roomName && p.status !== "Purchased").length;
  return activeVersions * 3 + activeItems;
}

export default async function RoomsPage() {
  const supabase = await createClient();
  const [rooms, { data: versionData }, { data: purchaseData }, { data: inspoData }] = await Promise.all([
    getRoomEntities(),
    supabase.from("room_design_versions").select("room_id, is_final, status"),
    supabase.from("purchases").select("room, status").is("archived_at", null).eq("scope", "household"),
    supabase.from("inspiration").select("room"),
  ]);
  const versions = (versionData ?? []) as Pick<RoomDesignVersion, "room_id" | "is_final" | "status">[];
  const purchases = (purchaseData ?? []) as Pick<Purchase, "room" | "status">[];
  const inspo = (inspoData ?? []) as Pick<Inspiration, "room">[];
  const sortedRooms = [...rooms].sort((a, b) => {
    const delta = activityScore(b.name, b.id, versions, purchases) - activityScore(a.name, a.id, versions, purchases);
    return delta || a.name.localeCompare(b.name);
  });

  const roomSummaries: RoomSummary[] = sortedRooms.map((room) => {
    const vs = versions.filter((v) => v.room_id === room.id);
    const finalCount = vs.filter((v) => v.is_final).length;
    const activeDesigns = vs.filter((v) => !v.is_final && v.status !== "archived").length;
    const roomPurchases = purchases.filter((p) => p.room === room.name);
    const bought = roomPurchases.filter((p) => p.status === "Purchased").length;
    const activeItems = roomPurchases.length - bought;
    const insp = inspo.filter((i) => i.room === room.name).length;
    return {
      id: room.id,
      name: room.name,
      sized: dims(room.width_cm, room.length_cm),
      designCount: vs.length,
      finalCount,
      itemCount: roomPurchases.length,
      bought,
      ideaCount: insp,
      inProgress: activeDesigns > 0 || activeItems > 0,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Room Designer"
        description="Design every room before you spend - layouts, colours and costs."
        info="Each room is a planning hub: capture its dimensions, try multiple design versions, link the purchases and inspiration tagged to it, and turn decisions into tasks. Tap a room to open its workspace."
      />

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No rooms yet. Add rooms in Settings, then come back to design them.
          </CardContent>
        </Card>
      ) : (
        <RoomsGrid rooms={roomSummaries} />
      )}
    </div>
  );
}
