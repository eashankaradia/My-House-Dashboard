import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as GBP currency. Defaults to whole pounds for tidy cards. */
export function formatCurrency(
  value: number | null | undefined,
  options: Intl.NumberFormatOptions = {},
): string {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    ...options,
  }).format(amount);
}

export function formatCompactCurrency(value: number | null | undefined): string {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return `${n.toFixed(digits)}%`;
}

/** Convert a recurring amount at a given frequency into a monthly equivalent. */
export function toMonthly(amount: number, frequency: string): number {
  switch (frequency) {
    case "weekly":
      return (amount * 52) / 12;
    case "monthly":
      return amount;
    case "quarterly":
      return amount / 3;
    case "annually":
      return amount / 12;
    case "one-off":
      return 0;
    default:
      return amount;
  }
}

/** Convert a recurring amount at a given frequency into an annual equivalent. */
export function toAnnual(amount: number, frequency: string): number {
  switch (frequency) {
    case "weekly":
      return amount * 52;
    case "monthly":
      return amount * 12;
    case "quarterly":
      return amount * 4;
    case "annually":
      return amount;
    case "one-off":
      return amount;
    default:
      return amount * 12;
  }
}

/** Whole days between today and a target date (negative = overdue). */
export function daysUntil(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function initialsFromName(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  }
  return (email?.[0] ?? "?").toUpperCase();
}

export function numberOr(value: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function stringOrNull(value: FormDataEntryValue | null): string | null {
  const s = typeof value === "string" ? value.trim() : "";
  return s.length ? s : null;
}
