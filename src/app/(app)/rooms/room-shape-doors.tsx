"use client";

import * as React from "react";
import { FlipHorizontal2, Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/shared/form-field";
import { lShapeOutline } from "@/lib/room-shape";
import type { Room, RoomDoor } from "@/lib/database.types";

const WALLS: RoomDoor["wall"][] = ["top", "bottom", "left", "right"];

/** Shape (incl. L-shape) and door placement for a room. */
export function RoomShapeDoors({ room, save }: { room: Room; save: (patch: Record<string, unknown>) => void }) {
  const [shape, setShape] = React.useState(room.shape);
  const [cutW, setCutW] = React.useState(room.width_cm ? Math.round(room.width_cm / 3) : 100);
  const [cutD, setCutD] = React.useState(room.length_cm ? Math.round(room.length_cm / 3) : 100);
  const [doors, setDoors] = React.useState<RoomDoor[]>(room.doors ?? []);

  function applyShape(next: string, cw = cutW, cd = cutD) {
    setShape(next);
    if (next === "l-shape" && room.width_cm && room.length_cm) {
      save({ shape: next, outline: lShapeOutline(room.width_cm, room.length_cm, cw, cd) });
    } else {
      save({ shape: next, outline: null });
    }
  }

  function saveDoors(next: RoomDoor[]) {
    setDoors(next);
    save({ doors: next });
  }
  const updateDoor = (i: number, patch: Partial<RoomDoor>) => saveDoors(doors.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-4">
          <Field label="Shape">
            <NativeSelect value={shape} onChange={(e) => applyShape(e.target.value)}>
              <option value="rectangle">Rectangle</option>
              <option value="square">Square</option>
              <option value="l-shape">L-shape</option>
              <option value="custom">Custom</option>
            </NativeSelect>
          </Field>
          {shape === "l-shape" ? (
            <>
              <Field label="Cut-out width (m)">
                <Input type="number" step="0.01" defaultValue={(cutW / 100).toString()} onBlur={(e) => { const cw = Math.round(Number(e.target.value) * 100); setCutW(cw); applyShape("l-shape", cw, cutD); }} />
              </Field>
              <Field label="Cut-out depth (m)">
                <Input type="number" step="0.01" defaultValue={(cutD / 100).toString()} onBlur={(e) => { const cd = Math.round(Number(e.target.value) * 100); setCutD(cd); applyShape("l-shape", cutW, cd); }} />
              </Field>
            </>
          ) : null}
        </div>
        {shape === "l-shape" && (!room.width_cm || !room.length_cm) ? (
          <p className="text-xs text-muted-foreground">Set the room width &amp; length above first, then the L-shape cut-out applies.</p>
        ) : shape === "l-shape" ? (
          <p className="text-xs text-muted-foreground">The cut-out is removed from the top-right corner of the plan.</p>
        ) : null}

        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Doors</p>
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => saveDoors([...doors, { wall: "bottom", offset: 0, width: 80 }])}>
              <Plus className="h-4 w-4" /> Add door
            </Button>
          </div>
          {doors.length === 0 ? (
            <p className="text-xs text-muted-foreground">No doors yet. Add one and it shows on the 2D plan.</p>
          ) : (
            doors.map((d, i) => (
              <div key={i} className="flex items-end gap-2">
                <Field label="Wall" className="flex-1">
                  <NativeSelect value={d.wall} onChange={(e) => updateDoor(i, { wall: e.target.value as RoomDoor["wall"] })}>
                    {WALLS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="From corner (m)" className="w-28">
                  <Input type="number" step="0.01" defaultValue={(d.offset / 100).toString()} onBlur={(e) => updateDoor(i, { offset: Math.round(Number(e.target.value) * 100) })} />
                </Field>
                <Field label="Width (m)" className="w-24">
                  <Input type="number" step="0.01" defaultValue={(d.width / 100).toString()} onBlur={(e) => updateDoor(i, { width: Math.round(Number(e.target.value) * 100) || 80 })} />
                </Field>
                <button
                  type="button"
                  onClick={() => updateDoor(i, { opens_out: !d.opens_out })}
                  aria-label={d.opens_out ? "Swing door inwards" : "Swing door outwards"}
                  className="mb-1 inline-flex items-center gap-1 rounded-md p-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <FlipHorizontal2 className="h-4 w-4" />
                  {d.opens_out ? "In" : "Out"}
                </button>
                <button type="button" onClick={() => saveDoors(doors.filter((_, j) => j !== i))} aria-label="Remove door" className="mb-1 rounded-md p-2 text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
