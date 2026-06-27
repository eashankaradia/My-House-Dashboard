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
