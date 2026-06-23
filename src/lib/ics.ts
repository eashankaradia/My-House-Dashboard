// Helpers to add an item to an external calendar app (Apple/Google/Outlook).

function toCalDate(date: string): string {
  // yyyy-mm-dd -> yyyymmdd
  return date.replace(/-/g, "");
}

function addOneDay(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return toCalDate(d.toISOString().slice(0, 10));
}

/** Build an all-day VEVENT .ics file body for a task with a due date. */
export function buildIcs(title: string, date: string, description = ""): string {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@myhouse`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//My House Dashboard//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${toCalDate(date)}`,
    `DTEND;VALUE=DATE:${addOneDay(date)}`,
    `SUMMARY:${escapeText(title)}`,
    description ? `DESCRIPTION:${escapeText(description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

function escapeText(s: string): string {
  return s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

/** A "add to Google Calendar" template URL for an all-day event. */
export function googleCalendarUrl(title: string, date: string, description = ""): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toCalDate(date)}/${addOneDay(date)}`,
    details: description,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
