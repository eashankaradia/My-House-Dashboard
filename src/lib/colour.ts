/** Client-side colour helpers — extract a palette from a photo, sample a pixel. */

export function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Average-bucket quantisation: returns the N most common colours as hex. */
export function extractPalette(img: HTMLImageElement, count = 6): string[] {
  const maxDim = 120;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
  const w = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
  const h = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, w, h);
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return [];
  }

  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 125) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const cur = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    cur.r += r;
    cur.g += g;
    cur.b += b;
    cur.n += 1;
    buckets.set(key, cur);
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map((c) => rgbToHex(c.r / c.n, c.g / c.n, c.b / c.n));
}

/** The hex colour at a fractional (0..1) position on the image. */
export function sampleColour(img: HTMLImageElement, xRatio: number, yRatio: number): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  const x = Math.floor(xRatio * canvas.width);
  const y = Math.floor(yRatio * canvas.height);
  try {
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    return rgbToHex(r, g, b);
  } catch {
    return null;
  }
}
