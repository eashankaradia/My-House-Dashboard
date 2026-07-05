import type { Room, RoomPoint } from "@/lib/database.types";

/** Rectangle outline from width × length (cm). */
export function rectOutline(w: number, l: number): RoomPoint[] {
  return [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: l },
    { x: 0, y: l },
  ];
}

/**
 * L-shape outline: a w×l bounding box with a rectangular notch (cutW × cutD)
 * removed from the top-right corner.
 */
export function lShapeOutline(w: number, l: number, cutW: number, cutD: number): RoomPoint[] {
  const cw = Math.min(cutW, w);
  const cd = Math.min(cutD, l);
  return [
    { x: 0, y: 0 },
    { x: w - cw, y: 0 },
    { x: w - cw, y: cd },
    { x: w, y: cd },
    { x: w, y: l },
    { x: 0, y: l },
  ];
}

export type CornerId = "tl" | "tr" | "bl" | "br";

/**
 * L-shaped footprint for corner furniture (e.g. a corner sofa): a w×d
 * bounding box with a notchW×notchD rectangle removed from one corner.
 */
export function lShapeFootprint(w: number, d: number, notchW: number, notchD: number, corner: CornerId = "tr"): RoomPoint[] {
  const base = lShapeOutline(w, d, notchW, notchD); // notch cut from the top-right corner
  const flipX = corner === "tl" || corner === "bl";
  const flipY = corner === "bl" || corner === "br";
  return base.map((p) => ({ x: flipX ? w - p.x : p.x, y: flipY ? d - p.y : p.y }));
}

/** The effective outline for a room — its stored polygon or a plain rectangle. */
export function outlinePoints(room: Pick<Room, "outline" | "width_cm" | "length_cm">): RoomPoint[] {
  if (room.outline && room.outline.length >= 3) return room.outline;
  const w = room.width_cm ?? 0;
  const l = room.length_cm ?? 0;
  return rectOutline(w, l);
}

export function pointsToSvg(points: RoomPoint[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}
