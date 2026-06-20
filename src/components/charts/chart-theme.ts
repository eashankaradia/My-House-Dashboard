// Shared palette for all charts (works in light & dark).
export const CHART_COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
  "#6366f1",
  "#ec4899",
  "#f97316",
  "#22c55e",
];

export const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
} as const;
