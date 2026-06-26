"use client";

import * as React from "react";
import { MEMBER_COLOR_TEXT } from "@/lib/constants";

/** name → colour key, provided once at the app layout. */
const HouseholdColorsContext = React.createContext<Record<string, string>>({});

export function HouseholdColorsProvider({
  colors,
  children,
}: {
  colors: Record<string, string>;
  children: React.ReactNode;
}) {
  return <HouseholdColorsContext.Provider value={colors}>{children}</HouseholdColorsContext.Provider>;
}

/** Returns the Tailwind text-colour class for a member's name, or "". */
export function useMemberColorClass(name?: string | null): string {
  const colors = React.useContext(HouseholdColorsContext);
  if (!name) return "";
  const key = colors[name];
  return key ? MEMBER_COLOR_TEXT[key] ?? "" : "";
}

/** Renders a member's name in their chosen colour (plain text if none set). */
export function ColoredName({ name, className }: { name?: string | null; className?: string }) {
  const colorClass = useMemberColorClass(name);
  if (!name) return null;
  return <span className={`${colorClass} ${className ?? ""}`.trim()}>{name}</span>;
}
