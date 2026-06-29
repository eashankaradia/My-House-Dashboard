import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A styled native <select>. Native (rather than the Radix Select) so it works
 * effortlessly with react-hook-form's `register` and feels great on mobile.
 */
const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          // 16px text on mobile stops iOS Safari auto-zooming on focus; 14px from sm up.
          "flex h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-9 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
    </div>
  ),
);
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
