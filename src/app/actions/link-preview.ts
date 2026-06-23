"use server";

export type LinkPreview = { title?: string; image?: string; price?: number; error?: string };

function meta(html: string, patterns: RegExp[]): string | undefined {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decode(m[1].trim());
  }
  return undefined;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * Fetches a URL and extracts Open Graph title/image/price so a wishlist option
 * or inspiration item can be auto-filled. Runs server-side (works on Vercel).
 */
export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  try {
    if (!/^https?:\/\//i.test(url)) return { error: "Enter a full URL starting with http(s)://" };
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; MyHouseDashboard/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { error: `Couldn't fetch (status ${res.status})` };
    const html = (await res.text()).slice(0, 500_000);

    const title =
      meta(html, [
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
        /<title[^>]*>([^<]+)<\/title>/i,
      ]) ?? undefined;

    const image = meta(html, [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    ]);

    const priceStr = meta(html, [
      /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+property=["']og:price:amount["'][^>]+content=["']([^"']+)["']/i,
      /itemprop=["']price["'][^>]+content=["']([^"']+)["']/i,
    ]);
    const price = priceStr ? Number(priceStr.replace(/[^0-9.]/g, "")) : undefined;

    return { title, image, price: Number.isFinite(price) ? price : undefined };
  } catch {
    return { error: "Couldn't read that link" };
  }
}
