"use client";

import { ExternalLink } from "lucide-react";

function embedUrl(link: string): string | null {
  try {
    const url = new URL(link);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "instagram.com") {
      const path = url.pathname.replace(/\/$/, "");
      if (path.startsWith("/reel/") || path.startsWith("/p/")) return `https://www.instagram.com${path}/embed`;
    }
    if (host === "tiktok.com" || host === "vm.tiktok.com") {
      const match = url.pathname.match(/\/video\/(\d+)/);
      if (match) return `https://www.tiktok.com/player/v1/${match[1]}`;
    }
    if (host === "facebook.com" || host === "fb.watch") {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(link)}&show_text=false`;
    }
    if (host === "youtube.com" || host === "youtu.be") {
      const id = host === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function SocialEmbed({ link, title }: { link: string; title: string }) {
  const src = embedUrl(link);
  if (!src) {
    return (
      <a href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
        Open original <ExternalLink className="h-3.5 w-3.5" />
      </a>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl bg-black">
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
        className="aspect-[9/14] max-h-[760px] w-full"
      />
    </div>
  );
}
