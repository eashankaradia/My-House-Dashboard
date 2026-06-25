"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { downloadCsv, toCsv } from "@/lib/csv";

type ExportSet = {
  label: string;
  filename: string;
  rows: Record<string, unknown>[];
  columns: string[];
};

export function ExportSettings({ sets }: { sets: Record<string, ExportSet> }) {
  const keys = Object.keys(sets);
  const [selected, setSelected] = React.useState(keys[0] ?? "");
  const current = sets[selected];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect value={selected} onChange={(event) => setSelected(event.target.value)} className="h-10 min-w-52">
        {Object.entries(sets).map(([key, set]) => <option key={key} value={key}>{set.label}</option>)}
      </NativeSelect>
      <Button
        type="button"
        variant="outline"
        disabled={!current || current.rows.length === 0}
        onClick={() => current && downloadCsv(current.filename, toCsv(current.rows, current.columns))}
      >
        <Download className="h-4 w-4" /> Export CSV
      </Button>
      {current ? <span className="text-sm text-muted-foreground">{current.rows.length} rows</span> : null}
    </div>
  );
}
