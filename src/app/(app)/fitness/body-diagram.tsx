"use client";

import { cn } from "@/lib/utils";

/**
 * A front/back human silhouette with one highlightable zone per muscle group
 * in MUSCLE_GROUPS. Limbs are tapered filled shapes (wider proximally,
 * narrower distally, rounded at the joint) rather than uniform-width tubes,
 * abs are segmented into a six-pack grid, and the torso has a waist taper
 * and hip flare — still stylised, not medically precise, but reads as an
 * actual body rather than a stick-and-blocks mannequin.
 */
export function BodyDiagram({ highlighted }: { highlighted: string[] }) {
  const is = (m: string) => highlighted.includes(m);
  const fill = (m: string) => (is(m) ? "fill-primary" : "fill-muted");
  const stroke = "stroke-border";

  // Tapered limb shapes (proximal → distal, rounded distal cap). Identical
  // positions front and back — only the muscle-group label differs.
  const leftThigh = "M43.08,124.73 L64.93,127.28 L53.95,186.81 Q46.19,192.95 40.05,185.19 Z";
  const rightThigh = "M96.93,124.73 L75.08,127.28 L86.05,186.81 Q93.81,192.95 99.95,185.19 Z";
  const leftCalf = "M39.01,185.64 L54.99,186.36 L49.50,230.20 Q44.80,234.5 40.50,229.80 Z";
  const rightCalf = "M100.99,185.64 L85.01,186.36 L90.50,230.20 Q95.20,234.5 99.50,229.80 Z";
  const leftUpperArm = "M24.51,47.19 L39.49,52.81 L22.62,92.11 Q14.89,95.62 11.38,87.89 Z";
  const rightUpperArm = "M115.49,47.19 L100.51,52.81 L117.38,92.11 Q125.11,95.62 128.62,87.89 Z";
  const leftForearm = "M11.06,89.15 L22.94,90.85 L15.46,132.64 Q10.36,136.46 6.55,131.36 Z";
  const rightForearm = "M128.94,89.15 L117.06,90.85 L124.54,132.64 Q129.64,136.46 133.45,131.36 Z";

  const torso =
    "M40,48 Q70,37 100,48 C98,64 94,80 89,94 Q100,102 96,114 Q70,126 44,114 Q40,102 51,94 C46,80 42,64 40,48 Z";

  return (
    <div className="flex items-center justify-center gap-6">
      {/* Front view */}
      <div className="flex flex-col items-center gap-1">
        <svg viewBox="0 0 140 250" className="h-56 w-auto">
          {/* head + neck */}
          <ellipse cx="70" cy="16" rx="12" ry="14" className="fill-muted stroke-border" strokeWidth="1" />
          <path d="M62,27 L62,38 Q70,43 78,38 L78,27 Z" className="fill-muted stroke-border" strokeWidth="1" />

          {/* torso silhouette (soft backdrop) */}
          <path d={torso} className="fill-muted/30 stroke-border" strokeWidth="1" />

          {/* legs */}
          <path d={leftThigh} className={cn(fill("Quads"), stroke)} strokeWidth="1" />
          <path d={rightThigh} className={cn(fill("Quads"), stroke)} strokeWidth="1" />
          <path d={leftCalf} className={cn(fill("Calves"), stroke)} strokeWidth="1" />
          <path d={rightCalf} className={cn(fill("Calves"), stroke)} strokeWidth="1" />
          {/* feet */}
          <ellipse cx="43" cy="236" rx="7" ry="4" className="fill-muted stroke-border" strokeWidth="1" />
          <ellipse cx="97" cy="236" rx="7" ry="4" className="fill-muted stroke-border" strokeWidth="1" />

          {/* arms */}
          <path d={leftUpperArm} className={cn(fill("Biceps"), stroke)} strokeWidth="1" />
          <path d={rightUpperArm} className={cn(fill("Biceps"), stroke)} strokeWidth="1" />
          <path d={leftForearm} className={cn(fill("Forearms"), stroke)} strokeWidth="1" />
          <path d={rightForearm} className={cn(fill("Forearms"), stroke)} strokeWidth="1" />
          {/* hands */}
          <ellipse cx="9" cy="138" rx="5" ry="6" className="fill-muted stroke-border" strokeWidth="1" />
          <ellipse cx="131" cy="138" rx="5" ry="6" className="fill-muted stroke-border" strokeWidth="1" />

          {/* shoulders (deltoids) */}
          <ellipse cx="35" cy="50" rx="12" ry="13" transform="rotate(-15 35 50)" className={cn(fill("Shoulders"), stroke)} strokeWidth="1" />
          <ellipse cx="105" cy="50" rx="12" ry="13" transform="rotate(15 105 50)" className={cn(fill("Shoulders"), stroke)} strokeWidth="1" />

          {/* chest (pecs) */}
          <path d="M44,52 C36,54 34,64 38,72 C42,78 50,80 56,76 C60,72 60,60 56,54 C53,50 48,50 44,52 Z" className={cn(fill("Chest"), stroke)} strokeWidth="1" />
          <path d="M96,52 C104,54 106,64 102,72 C98,78 90,80 84,76 C80,72 80,60 84,54 C87,50 92,50 96,52 Z" className={cn(fill("Chest"), stroke)} strokeWidth="1" />

          {/* abs — six-pack grid */}
          <rect x="56" y="80" width="12" height="11" rx="3" className={cn(fill("Abs"), stroke)} strokeWidth="1" />
          <rect x="72" y="80" width="12" height="11" rx="3" className={cn(fill("Abs"), stroke)} strokeWidth="1" />
          <rect x="56" y="93" width="12" height="11" rx="3" className={cn(fill("Abs"), stroke)} strokeWidth="1" />
          <rect x="72" y="93" width="12" height="11" rx="3" className={cn(fill("Abs"), stroke)} strokeWidth="1" />
          <rect x="56" y="106" width="12" height="11" rx="3" className={cn(fill("Abs"), stroke)} strokeWidth="1" />
          <rect x="72" y="106" width="12" height="11" rx="3" className={cn(fill("Abs"), stroke)} strokeWidth="1" />
        </svg>
        <p className="text-[11px] text-muted-foreground">Front</p>
      </div>

      {/* Back view */}
      <div className="flex flex-col items-center gap-1">
        <svg viewBox="0 0 140 250" className="h-56 w-auto">
          <ellipse cx="70" cy="16" rx="12" ry="14" className="fill-muted stroke-border" strokeWidth="1" />
          <path d="M62,27 L62,38 Q70,43 78,38 L78,27 Z" className="fill-muted stroke-border" strokeWidth="1" />

          <path d={torso} className="fill-muted/30 stroke-border" strokeWidth="1" />

          {/* hamstrings + calves */}
          <path d={leftThigh} className={cn(fill("Hamstrings"), stroke)} strokeWidth="1" />
          <path d={rightThigh} className={cn(fill("Hamstrings"), stroke)} strokeWidth="1" />
          <path d={leftCalf} className={cn(fill("Calves"), stroke)} strokeWidth="1" />
          <path d={rightCalf} className={cn(fill("Calves"), stroke)} strokeWidth="1" />
          <ellipse cx="43" cy="236" rx="7" ry="4" className="fill-muted stroke-border" strokeWidth="1" />
          <ellipse cx="97" cy="236" rx="7" ry="4" className="fill-muted stroke-border" strokeWidth="1" />

          {/* triceps + forearms */}
          <path d={leftUpperArm} className={cn(fill("Triceps"), stroke)} strokeWidth="1" />
          <path d={rightUpperArm} className={cn(fill("Triceps"), stroke)} strokeWidth="1" />
          <path d={leftForearm} className={cn(fill("Forearms"), stroke)} strokeWidth="1" />
          <path d={rightForearm} className={cn(fill("Forearms"), stroke)} strokeWidth="1" />
          <ellipse cx="9" cy="138" rx="5" ry="6" className="fill-muted stroke-border" strokeWidth="1" />
          <ellipse cx="131" cy="138" rx="5" ry="6" className="fill-muted stroke-border" strokeWidth="1" />

          <ellipse cx="35" cy="50" rx="12" ry="13" transform="rotate(-15 35 50)" className={cn(fill("Shoulders"), stroke)} strokeWidth="1" />
          <ellipse cx="105" cy="50" rx="12" ry="13" transform="rotate(15 105 50)" className={cn(fill("Shoulders"), stroke)} strokeWidth="1" />

          {/* traps */}
          <path d="M56,44 L70,35 L84,44 L78,54 L62,54 Z" className={cn(fill("Back"), stroke)} strokeWidth="1" />

          {/* lats / back, V-taper */}
          <path d="M42,54 Q70,45 98,54 L90,96 Q70,104 50,96 Z" className={cn(fill("Back"), stroke)} strokeWidth="1" />

          {/* glutes */}
          <ellipse cx="58" cy="110" rx="13" ry="14" className={cn(fill("Glutes"), stroke)} strokeWidth="1" />
          <ellipse cx="82" cy="110" rx="13" ry="14" className={cn(fill("Glutes"), stroke)} strokeWidth="1" />
        </svg>
        <p className="text-[11px] text-muted-foreground">Back</p>
      </div>
    </div>
  );
}
