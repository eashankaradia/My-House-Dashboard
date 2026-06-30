"use client";

import { cn } from "@/lib/utils";

/**
 * A simplified front/back human silhouette with one highlightable zone per
 * muscle group in MUSCLE_GROUPS. Not anatomically precise — just enough to
 * show, at a glance, what a plan or exercise works.
 */
export function BodyDiagram({ highlighted }: { highlighted: string[] }) {
  const is = (m: string) => highlighted.includes(m);
  const fill = (m: string) => (is(m) ? "fill-primary" : "fill-muted");
  const stroke = "stroke-border";

  return (
    <div className="flex items-center justify-center gap-6">
      {/* Front view */}
      <div className="flex flex-col items-center gap-1">
        <svg viewBox="0 0 120 220" className="h-52 w-auto">
          {/* head */}
          <circle cx="60" cy="18" r="14" className="fill-muted stroke-border" strokeWidth="1" />
          {/* shoulders */}
          <rect x="28" y="34" width="64" height="14" rx="6" className={cn(fill("Shoulders"), stroke)} strokeWidth="1" />
          {/* chest */}
          <rect x="36" y="48" width="48" height="28" rx="4" className={cn(fill("Chest"), stroke)} strokeWidth="1" />
          {/* abs */}
          <rect x="42" y="76" width="36" height="34" rx="4" className={cn(fill("Abs"), stroke)} strokeWidth="1" />
          {/* biceps (upper arms) */}
          <rect x="18" y="48" width="14" height="34" rx="6" className={cn(fill("Biceps"), stroke)} strokeWidth="1" />
          <rect x="88" y="48" width="14" height="34" rx="6" className={cn(fill("Biceps"), stroke)} strokeWidth="1" />
          {/* forearms */}
          <rect x="16" y="82" width="12" height="30" rx="5" className={cn(fill("Forearms"), stroke)} strokeWidth="1" />
          <rect x="92" y="82" width="12" height="30" rx="5" className={cn(fill("Forearms"), stroke)} strokeWidth="1" />
          {/* quads */}
          <rect x="42" y="112" width="16" height="44" rx="5" className={cn(fill("Quads"), stroke)} strokeWidth="1" />
          <rect x="62" y="112" width="16" height="44" rx="5" className={cn(fill("Quads"), stroke)} strokeWidth="1" />
          {/* calves */}
          <rect x="42" y="158" width="14" height="38" rx="5" className={cn(fill("Calves"), stroke)} strokeWidth="1" />
          <rect x="64" y="158" width="14" height="38" rx="5" className={cn(fill("Calves"), stroke)} strokeWidth="1" />
        </svg>
        <p className="text-[11px] text-muted-foreground">Front</p>
      </div>

      {/* Back view */}
      <div className="flex flex-col items-center gap-1">
        <svg viewBox="0 0 120 220" className="h-52 w-auto">
          <circle cx="60" cy="18" r="14" className="fill-muted stroke-border" strokeWidth="1" />
          <rect x="28" y="34" width="64" height="14" rx="6" className={cn(fill("Shoulders"), stroke)} strokeWidth="1" />
          {/* back */}
          <rect x="34" y="48" width="52" height="40" rx="4" className={cn(fill("Back"), stroke)} strokeWidth="1" />
          {/* triceps (upper arms) */}
          <rect x="18" y="48" width="14" height="34" rx="6" className={cn(fill("Triceps"), stroke)} strokeWidth="1" />
          <rect x="88" y="48" width="14" height="34" rx="6" className={cn(fill("Triceps"), stroke)} strokeWidth="1" />
          <rect x="16" y="82" width="12" height="30" rx="5" className={cn(fill("Forearms"), stroke)} strokeWidth="1" />
          <rect x="92" y="82" width="12" height="30" rx="5" className={cn(fill("Forearms"), stroke)} strokeWidth="1" />
          {/* glutes */}
          <rect x="40" y="90" width="40" height="22" rx="6" className={cn(fill("Glutes"), stroke)} strokeWidth="1" />
          {/* hamstrings */}
          <rect x="42" y="112" width="16" height="44" rx="5" className={cn(fill("Hamstrings"), stroke)} strokeWidth="1" />
          <rect x="62" y="112" width="16" height="44" rx="5" className={cn(fill("Hamstrings"), stroke)} strokeWidth="1" />
          <rect x="42" y="158" width="14" height="38" rx="5" className={cn(fill("Calves"), stroke)} strokeWidth="1" />
          <rect x="64" y="158" width="14" height="38" rx="5" className={cn(fill("Calves"), stroke)} strokeWidth="1" />
        </svg>
        <p className="text-[11px] text-muted-foreground">Back</p>
      </div>
    </div>
  );
}
