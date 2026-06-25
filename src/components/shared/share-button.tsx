"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareButton({
  title,
  text,
  label = "Share",
}: {
  title: string;
  text?: string;
  label?: string;
}) {
  async function share() {
    const url = window.location.href;
    const message = text ? `${title}\n${text}\n${url}` : `${title}\n${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: text ?? title, url });
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
