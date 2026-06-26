"use client";

import * as React from "react";
import { ROOMS } from "@/lib/constants";
import { getRooms } from "@/app/(app)/rooms/actions";

/**
 * The household's editable room list. Starts from the built-in defaults and
 * swaps in the customised list once it loads from the server.
 */
export function useRooms(): string[] {
  const [rooms, setRooms] = React.useState<string[]>([...ROOMS]);
  React.useEffect(() => {
    let active = true;
    getRooms().then((list) => {
      if (active && list.length) setRooms(list);
    });
    return () => {
      active = false;
    };
  }, []);
  return rooms;
}
