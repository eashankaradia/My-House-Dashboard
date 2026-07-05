"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareButton({
  title,
  text,
  url,
  label = "Share",
}: {
  title: string;
  text?: string;
  /** Path or absolute URL to share instead of the current page (e.g. a deep link to a specific item). */
  url?: string;
  label?: string;
}) {
  async function share() {
    const shareUrl = url ? new URL(url, window.location.origin).toString() : window.location.href;
    const message = text ? `${title}\n${text}\n${shareUrl}` : `${title}\n${shareUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: text ?? title, url: shareUrl });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={share} className="gap-1.5">
      <Share2 className="h-4 w-4" />
      {label}
    </Button>
  );
}
