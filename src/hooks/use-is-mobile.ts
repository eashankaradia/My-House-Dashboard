"use client";

import * as React from "react";

/**
 * True when the viewport is below the given breakpoint (default: Tailwind `sm`).
 * SSR-safe — assumes desktop on the server, corrects on mount. Used to force
 * card/list layouts on phones where horizontally-scrolling tables feel wrong.
 */
export function useIsMobile(breakpointPx = 640) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpointPx]);

  return isMobile;
}
