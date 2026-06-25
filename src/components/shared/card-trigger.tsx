"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A clickable region used as a dialog trigger that can wrap rich content
 * (headings, badges, meta) — unlike a <button>, which can't legally contain
 * block elements. Spread as the asChild target of a DialogTrigger: Radix wires
 * the click to open the dialog; we add Enter/Space for keyboard users.
 *
 * Place action controls (edit, delete, +/-) OUTSIDE this element so they keep
 * working independently.
 */
export const CardTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardTrigger({ className, onKeyDown, ...props }, ref) {
    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        className={cn("cursor-pointer text-left", className)}
        {...props}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            (e.currentTarget as HTMLElement).click();
          }
        }}
      />
    );
  },
);
