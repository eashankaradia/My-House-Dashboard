"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Ruler, Sofa } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type RoomSummary = {
  id: string;
  name: string;
  sized: string | null;
  designCount: number;
  finalCount: number;
  itemCount: number;
  bought: number;
  ideaCount: number;
  inProgress: boolean;
};

export function RoomsGrid({ rooms }: { rooms: RoomSummary[] }) {
  const [compact, setCompact] = React.useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <div className="flex items-center rounded-lg border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setCompact(false)}
            className={cn("rounded-md px-2.5 py-1", !compact && "bg-accent")}
          >
            Detailed
          </button>
          <button
            type="button"
            onClick={() => setCompact(true)}
            className={cn("rounded-md px-2.5 py-1", compact && "bg-accent")}
          >
            Compact
          </button>
        </div>
      </div>

      {compact ? (
        <div className="space-y-1.5">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-accent"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Sofa className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium">{room.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                {room.designCount} design{room.designCount === 1 ? "" : "s"}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Link key={room.id} href={`/rooms/${room.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium">
                        <Sofa className="h-4 w-4 shrink-0 text-muted-foreground" /> <span className="truncate">{room.name}</span>
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Ruler className="h-3 w-3 shrink-0" /> {room.sized ?? "No dimensions yet"}
                      </p>
                    </div>
                    {room.inProgress ? (
                      <Badge>In progress</Badge>
                    ) : room.finalCount > 0 ? (
                      <Badge variant="success">Final chosen</Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <Badge variant="secondary">
                      {room.designCount} design{room.designCount === 1 ? "" : "s"}
                    </Badge>
                    <Badge variant="outline">
                      {room.itemCount} item{room.itemCount === 1 ? "" : "s"}
                      {room.bought ? ` - ${room.bought} bought` : ""}
                    </Badge>
                    <Badge variant="outline">
                      {room.ideaCount} idea{room.ideaCount === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <p className="flex items-center justify-end gap-1 text-xs font-medium text-primary">
                    Open workspace <ArrowRight className="h-3.5 w-3.5" />
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
