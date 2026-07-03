/** Detect the source platform from a URL's hostname, e.g. for reels/inspiration links. */
export function sourceFromUrl(link: string): "Instagram" | "TikTok" | "Pinterest" | "YouTube" | null {
  try {
    const host = new URL(link).hostname.replace(/^www\./, "");
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("tiktok.com")) return "TikTok";
    if (host.includes("pinterest.") || host.includes("pin.it")) return "Pinterest";
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "YouTube";
    return null;
  } catch {
    return null;
  }
}
