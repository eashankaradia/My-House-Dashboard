"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, Heart, Plus, RotateCw, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/shared/form-field";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { outlinePoints, pointsToSvg } from "@/lib/room-shape";
import type { Room, RoomDesignVersion, RoomLayoutItem, RoomPoint } from "@/lib/database.types";
import { addLayoutItem, createPurchaseFromLayout, deleteLayoutItem, updateLayoutItem, updateRoomDetails } from "./actions";

const SNAP = 5; // cm
const LAYOUT_STATUSES = ["idea", "planned", "ordered", "delivered", "installed"] as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const PALETTE = ["#94a3b8", "#60a5fa", "#34d399", "#fbbf24", "#f87171", "#c084fc", "#f472b6", "#2dd4bf"];

const PRESETS: { category: string; w: number; d: number }[] = [
  { category: "Sofa", w: 200, d: 90 },
  { category: "Bed", w: 150, d: 200 },
  { category: "Desk", w: 120, d: 60 },
  { category: "Wardrobe", w: 100, d: 60 },
  { category: "Chair", w: 50, d: 50 },
  { category: "Dining Table", w: 160, d: 90 },
  { category: "TV Unit", w: 150, d: 40 },
  { category: "Coffee Table", w: 110, d: 60 },
  { category: "Rug", w: 200, d: 140 },
  { category: "Bookshelf", w: 80, d: 30 },
  { category: "Appliance", w: 60, d: 60 },
  { category: "Custom", w: 100, d: 60 },
];

const snap = (n: number) => Math.round(n / SNAP) * SNAP;

/** A saved purchase option with a footprint, placeable on the plan. */
export type WishlistOption = {
  id: string;
  purchase_id: string;
  purchase_name: string | null;
  name: string;
  width_cm: number;
  depth_cm: number;
  height_cm: number | null;
  shape: string | null;
  image_url: string | null;
};

export function FloorPlanner({
  room,
  version,
  initialItems,
  wishlist = [],
}: {
  room: Room;
  version: RoomDesignVersion;
  initialItems: RoomLayoutItem[];
  wishlist?: WishlistOption[];
}) {
  const W = version.width_cm ?? room.width_cm ?? 0;
  const L = version.length_cm ?? room.length_cm ?? 0;
  const [items, setItems] = React.useState<RoomLayoutItem[]>(initialItems);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved">("idle");
  const svgRef = React.useRef<SVGSVGElement>(null);
  const drag = React.useRef<{ id: string; px: number; py: number; ox: number; oy: number } | null>(null);
  const { toast } = useToast();

  // Manual room-shape editing: drag the outline's corners, add/remove points.
  const [editShape, setEditShape] = React.useState(false);
  const [outline, setOutline] = React.useState<RoomPoint[]>(() =>
    outlinePoints({ outline: room.outline, width_cm: W, length_cm: L }),
  );
  const outlineRef = React.useRef(outline);
  React.useEffect(() => {
    outlineRef.current = outline;
  }, [outline]);
  const vertexDrag = React.useRef<number | null>(null);

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const handleR = Math.max(6, Math.min(W || 100, L || 100) / 18);

  const persistOutline = React.useCallback(
    (next: RoomPoint[]) => {
      setStatus("saving");
      updateRoomDetails(room.id, { outline: next, shape: "custom" }).then((res) => {
        if (res?.error) {
          toast({ variant: "destructive", title: "Couldn't save shape", description: res.error });
          setStatus("idle");
        } else {
          setStatus("saved");
          setTimeout(() => setStatus("idle"), 1200);
        }
      });
    },
    [room.id, toast],
  );

  function commitOutline(next: RoomPoint[]) {
    setOutline(next);
    outlineRef.current = next;
    persistOutline(next);
  }
  function addVertex(i: number) {
    const a = outline[i];
    const b = outline[(i + 1) % outline.length];
    const mid = { x: snap((a.x + b.x) / 2), y: snap((a.y + b.y) / 2) };
    const next = [...outline];
    next.splice(i + 1, 0, mid);
    commitOutline(next);
  }
  function removeVertex(i: number) {
    if (outline.length <= 3) return;
    commitOutline(outline.filter((_, j) => j !== i));
  }
  function resetShape() {
    commitOutline([
      { x: 0, y: 0 },
      { x: W, y: 0 },
      { x: W, y: L },
      { x: 0, y: L },
    ]);
  }

  const persist = React.useCallback(
    (id: string, patch: Record<string, unknown>) => {
      setStatus("saving");
      updateLayoutItem(id, patch).then((res) => {
        if (res?.error) {
          toast({ variant: "destructive", title: "Couldn't save", description: res.error });
          setStatus("idle");
        } else {
          setStatus("saved");
          setTimeout(() => setStatus("idle"), 1200);
        }
      });
    },
    [toast],
  );

  // --- Drag handling (pointer → cm via the SVG's box) ----------------------
  React.useEffect(() => {
    function toCm(clientX: number, clientY: number) {
      const r = svgRef.current!.getBoundingClientRect();
      return { x: ((clientX - r.left) / r.width) * W, y: ((clientY - r.top) / r.height) * L };
    }
    function onMove(e: PointerEvent) {
      if (vertexDrag.current !== null) {
        const p = toCm(e.clientX, e.clientY);
        const idx = vertexDrag.current;
        setOutline((prev) =>
          prev.map((pt, j) => (j === idx ? { x: clamp(snap(p.x), 0, W), y: clamp(snap(p.y), 0, L) } : pt)),
        );
        return;
      }
      const d = drag.current;
      if (!d) return;
      const p = toCm(e.clientX, e.clientY);
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== d.id) return it;
          const x = clamp(snap(d.ox + (p.x - d.px)), 0, Math.max(0, W - it.width_cm));
          const y = clamp(snap(d.oy + (p.y - d.py)), 0, Math.max(0, L - it.depth_cm));
          return { ...it, x_cm: x, y_cm: y };
        }),
      );
    }
    function onUp() {
      if (vertexDrag.current !== null) {
        vertexDrag.current = null;
        persistOutline(outlineRef.current);
        return;
      }
      const d = drag.current;
      if (!d) return;
      drag.current = null;
      const it = items.find((i) => i.id === d.id);
      if (it) persist(it.id, { x_cm: it.x_cm, y_cm: it.y_cm });
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [W, L, items, persist, persistOutline]);

  function startDrag(e: React.PointerEvent, it: RoomLayoutItem) {
    e.preventDefault();
    setSelectedId(it.id);
    const r = svgRef.current!.getBoundingClientRect();
    drag.current = {
      id: it.id,
      px: ((e.clientX - r.left) / r.width) * W,
      py: ((e.clientY - r.top) / r.height) * L,
      ox: it.x_cm,
      oy: it.y_cm,
    };
  }

  function update(id: string, patch: Partial<RoomLayoutItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    persist(id, patch as Record<string, unknown>);
  }

  function rotate(it: RoomLayoutItem) {
    update(it.id, { width_cm: it.depth_cm, depth_cm: it.width_cm });
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) setSelectedId(null);
    deleteLayoutItem(id);
  }

  function linkPurchase(it: RoomLayoutItem) {
    setStatus("saving");
    createPurchaseFromLayout(it.id, room.name).then((res) => {
      if (res?.error || !res.purchaseId) {
        toast({ variant: "destructive", title: "Couldn't create purchase", description: res?.error });
        setStatus("idle");
        return;
      }
      setItems((prev) => prev.map((i) => (i.id === it.id ? { ...i, purchase_id: res.purchaseId!, status: "planned" } : i)));
      setStatus("saved");
      toast({ title: "Added to your wishlist", description: "Linked to this furniture item." });
      setTimeout(() => setStatus("idle"), 1200);
    });
  }

  async function add(data: { name: string; category: string; width_cm: number; depth_cm: number; color: string }) {
    const res = await addLayoutItem(version.id, data);
    if (res?.error || !res.item) {
      toast({ variant: "destructive", title: "Couldn't add", description: res?.error });
      return;
    }
    setItems((prev) => [...prev, res.item!]);
    setSelectedId(res.item.id);
  }

  async function addFromOption(opt: WishlistOption) {
    const res = await addLayoutItem(version.id, {
      name: opt.name,
      category: opt.purchase_name ?? "Wishlist",
      width_cm: opt.width_cm,
      depth_cm: opt.depth_cm,
      height_cm: opt.height_cm ?? undefined,
      shape: opt.shape ?? "rectangle",
      purchase_id: opt.purchase_id,
      option_id: opt.id,
      color: PALETTE[1],
    });
    if (res?.error || !res.item) {
      toast({ variant: "destructive", title: "Couldn't add", description: res?.error });
      return;
    }
    setItems((prev) => [...prev, res.item!]);
    setSelectedId(res.item.id);
    toast({ title: "Placed on the plan", description: `${opt.name} — drag it into position.` });
  }

  if (!W || !L) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Set this room&apos;s width and length on the Overview tab to start planning to scale.
        </CardContent>
      </Card>
    );
  }

  const usedArea = items.reduce((s, it) => s + it.width_cm * it.depth_cm, 0);
  const usedPct = Math.round((usedArea / (W * L)) * 100);
  const overlapping = findOverlaps(items);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {(W / 100).toFixed(2)}m × {(L / 100).toFixed(2)}m · {usedPct}% floor used
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
          </span>
          <Button variant={editShape ? "default" : "outline"} size="sm" onClick={() => setEditShape((v) => !v)}>
            {editShape ? "Done" : "Edit shape"}
          </Button>
          {!editShape && wishlist.length ? <AddFromWishlist options={wishlist} onPlace={addFromOption} /> : null}
          {!editShape ? <AddFurniture onAdd={add} /> : null}
        </div>
      </div>

      {editShape ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span>Drag the blue corners. Tap + on an edge to add a point, red dot to remove.</span>
          <button type="button" onClick={resetShape} className="shrink-0 font-medium text-foreground hover:underline">Reset to rectangle</button>
        </div>
      ) : null}

      <Card>
        <CardContent className="p-2">
          <div className="mx-auto w-full" style={{ maxWidth: 640 }}>
            <svg
              ref={svgRef}
              viewBox={`-10 -10 ${W + 20} ${L + 20}`}
              preserveAspectRatio="xMidYMid meet"
              className="w-full touch-none select-none"
              style={{ maxHeight: "65vh" }}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) setSelectedId(null);
              }}
            >
              {/* grid */}
              {Array.from({ length: Math.floor(W / 50) + 1 }, (_, i) => (
                <line key={`v${i}`} x1={i * 50} y1={0} x2={i * 50} y2={L} stroke="currentColor" className="text-border" strokeWidth={1} />
              ))}
              {Array.from({ length: Math.floor(L / 50) + 1 }, (_, i) => (
                <line key={`h${i}`} x1={0} y1={i * 50} x2={W} y2={i * 50} stroke="currentColor" className="text-border" strokeWidth={1} />
              ))}
              {/* room outline (polygon supports L-shapes + manual editing) */}
              <polygon points={pointsToSvg(outline)} fill={editShape ? "rgba(14,165,233,0.06)" : "none"} stroke="currentColor" className="text-foreground" strokeWidth={3} />

              {/* doors */}
              {(room.doors ?? []).map((d, i) => {
                const off = Math.max(0, d.offset);
                const wd = Math.max(20, d.width);
                let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
                if (d.wall === "top") { x1 = off; y1 = 0; x2 = off + wd; y2 = 0; }
                else if (d.wall === "bottom") { x1 = off; y1 = L; x2 = off + wd; y2 = L; }
                else if (d.wall === "left") { x1 = 0; y1 = off; x2 = 0; y2 = off + wd; }
                else { x1 = W; y1 = off; x2 = W; y2 = off + wd; }
                return (
                  <g key={`door${i}`}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth={6} />
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0ea5e9" strokeWidth={3} strokeDasharray="8 6" />
                  </g>
                );
              })}

              {items.map((it) => {
                const isSel = it.id === selectedId;
                const bad = overlapping.has(it.id);
                const fill = it.color ?? "#94a3b8";
                return (
                  <g
                    key={it.id}
                    onPointerDown={editShape ? undefined : (e) => startDrag(e, it)}
                    className={editShape ? "" : "cursor-move"}
                    style={editShape ? { pointerEvents: "none", opacity: 0.5 } : undefined}
                  >
                    {it.shape === "round" ? (
                      <ellipse
                        cx={it.x_cm + it.width_cm / 2}
                        cy={it.y_cm + it.depth_cm / 2}
                        rx={it.width_cm / 2}
                        ry={it.depth_cm / 2}
                        fill={fill}
                        fillOpacity={0.85}
                        stroke={bad ? "#ef4444" : isSel ? "#0ea5e9" : "#1f2937"}
                        strokeWidth={isSel || bad ? 4 : 2}
                      />
                    ) : (
                      <rect
                        x={it.x_cm}
                        y={it.y_cm}
                        width={it.width_cm}
                        height={it.depth_cm}
                        rx={4}
                        fill={fill}
                        fillOpacity={0.85}
                        stroke={bad ? "#ef4444" : isSel ? "#0ea5e9" : "#1f2937"}
                        strokeWidth={isSel || bad ? 4 : 2}
                      />
                    )}
                    <text
                      x={it.x_cm + it.width_cm / 2}
                      y={it.y_cm + it.depth_cm / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pointer-events-none fill-white"
                      style={{ fontSize: Math.max(12, Math.min(W, L) / 22) }}
                    >
                      {it.name}
                    </text>
                  </g>
                );
              })}

              {/* Manual shape editing: drag corners, add (+) / remove (×) points */}
              {editShape
                ? outline.map((pt, i) => {
                    const nx = outline[(i + 1) % outline.length];
                    const mx = (pt.x + nx.x) / 2;
                    const my = (pt.y + nx.y) / 2;
                    return (
                      <g key={`vx${i}`}>
                        <circle cx={mx} cy={my} r={handleR * 0.7} fill="#fff" stroke="#0ea5e9" strokeWidth={2} className="cursor-pointer" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); addVertex(i); }} />
                        <text x={mx} y={my} textAnchor="middle" dominantBaseline="middle" className="pointer-events-none fill-sky-600" style={{ fontSize: handleR }}>+</text>
                        <circle cx={pt.x} cy={pt.y} r={handleR} fill="#0ea5e9" fillOpacity={0.9} stroke="#fff" strokeWidth={2} className="cursor-move" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); vertexDrag.current = i; }} />
                        {outline.length > 3 ? (
                          <circle cx={pt.x + handleR * 1.4} cy={pt.y - handleR * 1.4} r={handleR * 0.6} fill="#ef4444" stroke="#fff" strokeWidth={2} className="cursor-pointer" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); removeVertex(i); }} />
                        ) : null}
                      </g>
                    );
                  })
                : null}
            </svg>
          </div>
        </CardContent>
      </Card>

      {overlapping.size > 0 ? (
        <p className="text-center text-xs text-destructive">Some items overlap (shown in red).</p>
      ) : null}

      {selected ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <Input
                value={selected.name}
                onChange={(e) => setItems((prev) => prev.map((i) => (i.id === selected.id ? { ...i, name: e.target.value } : i)))}
                onBlur={(e) => persist(selected.id, { name: e.target.value })}
                className="h-9 max-w-[60%] font-medium"
              />
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => rotate(selected)}>
                  <RotateCw className="h-4 w-4" /> Rotate
                </Button>
                <button onClick={() => remove(selected.id)} aria-label="Delete" className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Width (cm)">
                <Input
                  type="number"
                  defaultValue={selected.width_cm}
                  onBlur={(e) => update(selected.id, { width_cm: Number(e.target.value) || selected.width_cm })}
                />
              </Field>
              <Field label="Depth (cm)">
                <Input
                  type="number"
                  defaultValue={selected.depth_cm}
                  onBlur={(e) => update(selected.id, { depth_cm: Number(e.target.value) || selected.depth_cm })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Shape">
                <NativeSelect
                  value={selected.shape ?? "rectangle"}
                  onChange={(e) => update(selected.id, { shape: e.target.value })}
                >
                  <option value="rectangle">Rectangle</option>
                  <option value="square">Square</option>
                  <option value="round">Round / Oval</option>
                </NativeSelect>
              </Field>
              <Field label="Status">
                <NativeSelect value={selected.status} onChange={(e) => update(selected.id, { status: e.target.value })}>
                  {LAYOUT_STATUSES.map((s) => (
                    <option key={s} value={s}>{cap(s)}</option>
                  ))}
                </NativeSelect>
              </Field>
              <div className="flex items-end">
                {selected.purchase_id ? (
                  <Link href={`/purchases?item=${selected.purchase_id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-accent">
                    Linked purchase <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" className="h-9" onClick={() => linkPurchase(selected)}>Create purchase</Button>
                )}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium">Colour</p>
              <div className="flex flex-wrap gap-2">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    aria-label={`Colour ${c}`}
                    onClick={() => update(selected.id, { color: c })}
                    className={cn("h-7 w-7 rounded-full border-2", selected.color === c ? "border-foreground" : "border-transparent")}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="text-center text-xs text-muted-foreground">Tap a piece of furniture to edit it, or add one above.</p>
      )}
    </div>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function findOverlaps(items: RoomLayoutItem[]): Set<string> {
  const bad = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      const overlap =
        a.x_cm < b.x_cm + b.width_cm &&
        a.x_cm + a.width_cm > b.x_cm &&
        a.y_cm < b.y_cm + b.depth_cm &&
        a.y_cm + a.depth_cm > b.y_cm;
      if (overlap) {
        bad.add(a.id);
        bad.add(b.id);
      }
    }
  }
  return bad;
}

function AddFromWishlist({
  options,
  onPlace,
}: {
  options: WishlistOption[];
  onPlace: (opt: WishlistOption) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function place(opt: WishlistOption) {
    startTransition(async () => {
      await onPlace(opt);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Heart className="h-4 w-4" /> From wishlist
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Place a saved option</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Purchase options with a shape and size show up here. Pick one to drop it onto the plan to scale.
        </p>
        <div className="max-h-[55vh] space-y-1.5 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={pending}
              onClick={() => place(opt)}
              className="flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors hover:bg-accent disabled:opacity-50"
            >
              {opt.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={opt.image_url} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Heart className="h-4 w-4" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{opt.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[
                    opt.purchase_name,
                    `${Math.round(opt.width_cm)}×${Math.round(opt.depth_cm)} cm`,
                    opt.shape ? cap(opt.shape) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddFurniture({
  onAdd,
}: {
  onAdd: (data: { name: string; category: string; width_cm: number; depth_cm: number; color: string }) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [category, setCategory] = React.useState(PRESETS[0].category);
  const [name, setName] = React.useState("");
  const [w, setW] = React.useState(String(PRESETS[0].w));
  const [d, setD] = React.useState(String(PRESETS[0].d));
  const [color, setColor] = React.useState(PALETTE[0]);

  function pickCategory(cat: string) {
    setCategory(cat);
    const preset = PRESETS.find((p) => p.category === cat);
    if (preset) {
      setW(String(preset.w));
      setD(String(preset.d));
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await onAdd({
        name: name.trim() || category,
        category,
        width_cm: Number(w) || 100,
        depth_cm: Number(d) || 60,
        color,
      });
      setOpen(false);
      setName("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Furniture</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add furniture</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Type">
            <NativeSelect value={category} onChange={(e) => pickCategory(e.target.value)}>
              {PRESETS.map((p) => (
                <option key={p.category} value={p.category}>{p.category}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Name (optional)">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={category} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Width (cm)"><Input type="number" value={w} onChange={(e) => setW(e.target.value)} /></Field>
            <Field label="Depth (cm)"><Input type="number" value={d} onChange={(e) => setD(e.target.value)} /></Field>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium">Colour</p>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Colour ${c}`}
                  onClick={() => setColor(c)}
                  className={cn("h-7 w-7 rounded-full border-2", color === c ? "border-foreground" : "border-transparent")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add to plan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
