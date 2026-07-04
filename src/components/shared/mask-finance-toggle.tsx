"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMaskFinance } from "@/hooks/use-mask-finance";

/** Toggles hiding personal finance amounts behind bullets, app-wide. */
export function MaskFinanceToggle() {
  const { masked, setMasked } = useMaskFinance();
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => setMasked(!masked)}
      aria-label={masked ? "Show finance numbers" : "Hide finance numbers"}
      title={masked ? "Show finance numbers" : "Hide finance numbers"}
    >
      {masked ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </Button>
  );
}
