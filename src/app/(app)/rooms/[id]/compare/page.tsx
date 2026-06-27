import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Room, RoomDesignVersion, RoomLayoutItem } from "@/lib/database.types";

export const metadata = { title: "Compare designs" };

export default async function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: roomData } = await supabase.from("rooms").select("*").eq("id", id).single();
  const room = roomData as Room | null;
  if (!room) notFound();

  const { data: versionData } = await supabase
    .from("room_design_versions")
    .select("*")
    .eq("room_id", id)
    .neq("status", "archived")
    .order("created_at");
  const versions = (versionData ?? []) as RoomDesignVersion[];
  const { data: itemData } = await supabase
    .from("room_design_layout_items")
    .select("*")
    .in("version_id", versions.map((v) => v.id).length ? versions.map((v) => v.id) : ["00000000-0000-0000-0000-000000000000"]);
  const items = (itemData ?? []) as RoomLayoutItem[];

  const metrics = versions.map((v) => {
    const vItems = items.filter((i) => i.version_id === v.id);
    const itemCost = vItems.reduce((s, i) => s + Number(i.cost ?? 0), 0);
    const cost = v.cost_estimate != null ? Number(v.cost_estimate) : itemCost;
    const w = v.width_cm ?? room.width_cm ?? 0;
    const l = v.length_cm ?? room.length_cm ?? 0;
    const used = vItems.reduce((s, i) => s + i.width_cm * i.depth_cm, 0);
    const floorPct = w && l ? Math.round((used / (w * l)) * 100) : null;
    return { v, items: vItems, cost, floorPct };
  });

  const costs = metrics.filter((m) => m.cost > 0).map((m) => m.cost);
  const cheapest = costs.length ? Math.min(...costs) : null;

  return (
    <div className="space-y-4">
      <Link href={`/rooms/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {room.name}
      </Link>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Compare designs</h1>
        <p className="text-sm text-muted-foreground">Cost, furniture and colours side by side — pick what to spend on.</p>
      </div>

      {metrics.length < 2 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Add at least two design versions to compare them.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-flow-col auto-cols-[minmax(220px,1fr)] gap-3 overflow-x-auto pb-2">
          {metrics.map(({ v, items: vItems, cost, floorPct }) => (
            <Card key={v.id} className={v.is_final ? "border-emerald-500/40" : undefined}>
              <CardContent className="space-y-3 p-4">
                <div>
                  <p className="flex items-center gap-1.5 font-medium">
                    {v.name}
                    {v.is_final ? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> : null}
                  </p>
                  <Badge variant="secondary">{v.status}</Badge>
                </div>

                <Row label="Cost">
                  <span className={cost > 0 && cost === cheapest ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-medium"}>
                    {formatCurrency(cost)}{cost > 0 && cost === cheapest ? " ·cheapest" : ""}
                  </span>
                </Row>
                <Row label="Furniture">{vItems.length} item{vItems.length === 1 ? "" : "s"}</Row>
                <Row label="Floor used">{floorPct == null ? "—" : `${floorPct}%`}</Row>

                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Colours</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[v.wall_color, v.floor_color, v.trim_color, v.ceiling_color].filter(Boolean).length ? (
                      [v.wall_color, v.floor_color, v.trim_color, v.ceiling_color].filter(Boolean).map((c, i) => (
                        <span key={i} className="h-6 w-6 rounded border" style={{ backgroundColor: c as string }} title={c as string} />
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">None set</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Items</p>
                  {vItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No furniture yet</p>
                  ) : (
                    <ul className="space-y-0.5 text-xs">
                      {vItems.map((it) => (
                        <li key={it.id} className="flex justify-between gap-2">
                          <span className="truncate">{it.name}</span>
                          {it.cost ? <span className="shrink-0 text-muted-foreground">{formatCurrency(it.cost)}</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Link href={`/rooms/${id}/design/${v.id}`} className="inline-block text-xs font-medium text-primary hover:underline">
                  Open plan →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}
