"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { AddPills } from "./add-menu";

/**
 * Desktop-only floating add button (mobile uses the centred + in the bottom
 * tab bar). Pills mount only while open; the menu stays open when a pill is
 * tapped so the form's dialog can open over it.
 */
export function FloatingAdd() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 hidden flex-col items-end gap-2 lg:flex">
      {open ? <AddPills className="flex flex-col items-end gap-2" /> : null}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close add menu" : "Add new"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}
