"use client";

import { CalendarPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildIcs, downloadIcs, googleCalendarUrl } from "@/lib/ics";

/** Adds an item with a date to the user's external calendar app. */
export function AddToCalendar({
  title,
  date,
  description = "",
}: {
  title: string;
  date: string;
  description?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Add to calendar"
        >
          <CalendarPlus className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={googleCalendarUrl(title, date, description)} target="_blank" rel="noreferrer">
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => downloadIcs(title.slice(0, 40) || "task", buildIcs(title, date, description))}
        >
          Apple / Outlook (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
