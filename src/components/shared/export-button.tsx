"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadCsv, toCsv } from "@/lib/csv";

type Props = {
  rows: Record<string, unknown>[];
  columns: string[];
  filename: string;
  label?: string;
};

/** Exports the given rows/columns to a CSV download. */
export function ExportButton({ rows, columns, filename, label = "Export CSV" }: Props) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={rows.length === 0}
      onClick={() => downloadCsv(filename, toCsv(rows, columns))}
      className="gap-1.5"
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}
