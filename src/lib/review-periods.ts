function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The Monday (ISO week start) of the week containing `d`. */
export function weekStart(d: Date = new Date()): string {
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return ymd(monday);
}

/** The 1st of the month containing `d`. */
export function monthStart(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** "17–23 Jun 2026" style label for the week starting on `weekStartStr`. */
export function weekLabel(weekStartStr: string): string {
  const start = new Date(`${weekStartStr}T00:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = start.toLocaleDateString("en-GB", { day: "numeric", month: sameMonth ? undefined : "short" });
  const endLabel = end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${startLabel}–${endLabel}`;
}

/** "June 2026" style label for the month starting on `monthStartStr`. */
export function monthLabel(monthStartStr: string): string {
  return new Date(`${monthStartStr}T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
