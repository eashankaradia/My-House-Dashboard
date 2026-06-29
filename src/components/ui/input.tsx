import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        // 16px text on mobile stops iOS Safari auto-zooming on focus; 14px from sm up.
        "flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:text-sm",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
