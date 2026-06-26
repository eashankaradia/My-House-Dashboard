"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { MEMBER_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { updateMemberColor } from "./actions";

export function ColorPicker({ initial, name }: { initial: string | null; name: string }) {
  const [color, setColor] = React.useState(initial ?? "");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const activeText = MEMBER_COLORS.find((c) => c.key === color)?.text ?? "";

  function pick(key: string) {
    const next = key === color ? "" : key;
    setColor(next);
    startTransition(async () => {
      const res = await updateMemberColor(next);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't save", description: res.error });
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Your name shows as{" "}
        <span className={cn("font-semibold", activeText)}>{name || "your name"}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {MEMBER_COLORS.map((c) => (
          <button
            key={c.key}
            type="button"
            disabled={pending}
            aria-label={c.label}
            aria-pressed={color === c.key}
            onClick={() => pick(c.key)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-white transition-transform hover:scale-110",
              c.dot,
              color === c.key ? "ring-2 ring-offset-2 ring-foreground" : "",
            )}
          >
            {color === c.key ? <Check className="h-4 w-4" /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
