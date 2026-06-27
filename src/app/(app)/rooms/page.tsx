import Link from "next/link";
import { ArrowRight, Ruler, Sofa } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Inspiration, Purchase, RoomDesignVersion } from "@/lib/database.types";
import { getRoomEntities } from "./actions";

export const metadata = { title: "Room Designer" };

function dims(w: number | null, l: number | null) {
  if (!w || !l) return null;
  return `${(w / 100).toFixed(2)}m × ${(l / 100).toFixed(2)}m`;
}

export default async function RoomsPage() {
  const supabase = await createClient();
  const [rooms, { data: versionData }, { data: purchaseData }, { data: inspoData }] = await Promise.all([
    getRoomEntities(),
    supabase.from("room_design_versions").select("room_id, is_final, status"),
    supabase.from("purchases").select("room, status").is("archived_at", null),
    supabase.from("inspiration").select("room"),
  ]);
  const versions = (versionData ?? []) as Pick<RoomDesignVersion, "room_id" | "is_final" | "status">[];
  const purchases = (purchaseData ?? []) as Pick<Purchase, "room" | "status">[];
  const inspo = (inspoData ?? []) as Pick<Inspiration, "room">[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Room Designer"
        description="Design every room before you spend — layouts, colours and costs."
        info="Each room is a planning hub: capture its dimensions, try multiple design versions, link the purchases and inspiration tagged to it, and turn decisions into tasks. Tap a room to open its workspace."
      />

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No rooms yet. Add rooms in Settings → Rooms, then come back to design them.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => {
            const vs = versions.filter((v) => v.room_id === room.id);
            const finalCount = vs.filter((v) => v.is_final).length;
            const roomPurchases = purchases.filter((p) => p.room === room.name);
            const bought = roomPurchases.filter((p) => p.status === "Purchased").length;
            const insp = inspo.filter((i) => i.room === room.name).length;
            const sized = dims(room.width_cm, room.length_cm);
            return (
              <Link key={room.id} href={`/rooms/${room.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-medium">
                          <Sofa className="h-4 w-4 text-muted-foreground" /> {room.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Ruler className="h-3 w-3" /> {sized ?? "No dimensions yet"}
                        </p>
                      </div>
                      {finalCount > 0 ? <Badge variant="success">Final chosen</Badge> : null}
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <Badge variant="secondary">{vs.length} design{vs.length === 1 ? "" : "s"}</Badge>
                      <Badge variant="outline">{roomPurchases.length} item{roomPurchases.length === 1 ? "" : "s"}{bought ? ` · ${bought} bought` : ""}</Badge>
                      <Badge variant="outline">{insp} idea{insp === 1 ? "" : "s"}</Badge>
                    </div>
                    <p className="flex items-center justify-end gap-1 text-xs font-medium text-primary">
                      Open workspace <ArrowRight className="h-3.5 w-3.5" />
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
