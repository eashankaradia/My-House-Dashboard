"use client";

import { cn } from "@/lib/utils";

/**
 * A simplified front/back human silhouette with one highlightable zone per
 * muscle group in MUSCLE_GROUPS. Not anatomically precise — just enough to
 * show, at a glance, what a plan or exercise works. Limbs are drawn as
 * rounded, angled capsules (not axis-aligned boxes) so the figure reads as
 * a relaxed standing pose rather than a rigid stick-and-blocks mannequin.
 */
export function BodyDiagram({ highlighted }: { highlighted: string[] }) {
  const is = (m: string) => highlighted.includes(m);
  const fill = (m: string) => (is(m) ? "fill-primary" : "fill-muted");
  const limb = (m: string) => (is(m) ? "stroke-primary" : "stroke-muted");
  const stroke = "stroke-border";

  return (
    <div className="flex items-center justify-center gap-6">
      {/* Front view */}
      <div className="flex flex-col items-center gap-1">
        <svg viewBox="0 0 140 250" className="h-56 w-auto">
          {/* head + neck */}
          <ellipse cx="70" cy="18" rx="13" ry="15" className="fill-muted stroke-border" strokeWidth="1" />
          <rect x="63" y="31" width="14" height="11" rx="5" className="fill-muted stroke-border" strokeWidth="1" />

          {/* torso base (soft silhouette behind the highlighted zones) */}
          <path d="M39 52 Q70 40 101 52 L97 126 Q70 138 43 126 Z" className="fill-muted/30 stroke-border" strokeWidth="1" />

          {/* legs — angled apart in a relaxed stance */}
          <path d="M54 126 L47 186" strokeWidth="22" strokeLinecap="round" className={cn(limb("Quads"), "fill-none")} />
          <path d="M86 126 L93 186" strokeWidth="22" strokeLinecap="round" className={cn(limb("Quads"), "fill-none")} />
          <path d="M47 186 L45 230" strokeWidth="15" strokeLinecap="round" className={cn(limb("Calves"), "fill-none")} />
          <path d="M93 186 L95 230" strokeWidth="15" strokeLinecap="round" className={cn(limb("Calves"), "fill-none")} />

          {/* arms — angled slightly out from the body */}
          <path d="M32 50 L17 90" strokeWidth="18" strokeLinecap="round" className={cn(limb("Biceps"), "fill-none")} />
          <path d="M108 50 L123 90" strokeWidth="18" strokeLinecap="round" className={cn(limb("Biceps"), "fill-none")} />
          <path d="M17 90 L11 132" strokeWidth="13" strokeLinecap="round" className={cn(limb("Forearms"), "fill-none")} />
          <path d="M123 90 L129 132" strokeWidth="13" strokeLinecap="round" className={cn(limb("Forearms"), "fill-none")} />

          {/* shoulders */}
          <ellipse cx="36" cy="51" rx="13" ry="11" transform="rotate(-18 36 51)" className={cn(fill("Shoulders"), stroke)} strokeWidth="1" />
          <ellipse cx="104" cy="51" rx="13" ry="11" transform="rotate(18 104 51)" className={cn(fill("Shoulders"), stroke)} strokeWidth="1" />

          {/* chest */}
          <ellipse cx="58" cy="65" rx="16" ry="13" className={cn(fill("Chest"), stroke)} strokeWidth="1" />
          <ellipse cx="82" cy="65" rx="16" ry="13" className={cn(fill("Chest"), stroke)} strokeWidth="1" />

          {/* abs */}
          <rect x="49" y="82" width="42" height="42" rx="16" className={cn(fill("Abs"), stroke)} strokeWidth="1" />
        </svg>
        <p className="text-[11px] text-muted-foreground">Front</p>
      </div>

      {/* Back view */}
      <div className="flex flex-col items-center gap-1">
        <svg viewBox="0 0 140 250" className="h-56 w-auto">
          <ellipse cx="70" cy="18" rx="13" ry="15" className="fill-muted stroke-border" strokeWidth="1" />
          <rect x="63" y="31" width="14" height="11" rx="5" className="fill-muted stroke-border" strokeWidth="1" />

          <path d="M39 52 Q70 40 101 52 L97 126 Q70 138 43 126 Z" className="fill-muted/30 stroke-border" strokeWidth="1" />

          {/* hamstrings + calves */}
          <path d="M54 126 L47 186" strokeWidth="22" strokeLinecap="round" className={cn(limb("Hamstrings"), "fill-none")} />
          <path d="M86 126 L93 186" strokeWidth="22" strokeLinecap="round" className={cn(limb("Hamstrings"), "fill-none")} />
          <path d="M47 186 L45 230" strokeWidth="15" strokeLinecap="round" className={cn(limb("Calves"), "fill-none")} />
          <path d="M93 186 L95 230" strokeWidth="15" strokeLinecap="round" className={cn(limb("Calves"), "fill-none")} />

          {/* triceps + forearms */}
          <path d="M32 50 L17 90" strokeWidth="18" strokeLinecap="round" className={cn(limb("Triceps"), "fill-none")} />
          <path d="M108 50 L123 90" strokeWidth="18" strokeLinecap="round" className={cn(limb("Triceps"), "fill-none")} />
          <path d="M17 90 L11 132" strokeWidth="13" strokeLinecap="round" className={cn(limb("Forearms"), "fill-none")} />
          <path d="M123 90 L129 132" strokeWidth="13" strokeLinecap="round" className={cn(limb("Forearms"), "fill-none")} />

          <ellipse cx="36" cy="51" rx="13" ry="11" transform="rotate(-18 36 51)" className={cn(fill("Shoulders"), stroke)} strokeWidth="1" />
          <ellipse cx="104" cy="51" rx="13" ry="11" transform="rotate(18 104 51)" className={cn(fill("Shoulders"), stroke)} strokeWidth="1" />

          {/* back */}
          <path d="M40 54 Q70 46 100 54 L94 104 Q70 114 46 104 Z" className={cn(fill("Back"), stroke)} strokeWidth="1" />

          {/* glutes */}
          <ellipse cx="70" cy="112" rx="24" ry="15" className={cn(fill("Glutes"), stroke)} strokeWidth="1" />
        </svg>
        <p className="text-[11px] text-muted-foreground">Back</p>
      </div>
    </div>
  );
}
