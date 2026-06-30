import type { MetadataRoute } from "next";

const isLife = process.env.NEXT_PUBLIC_APP === "life";
const appName = isLife ? "MyLife" : "My House";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appName,
    short_name: appName,
    description: isLife
      ? "Your premium personal operating system."
      : "Your home command centre.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0f0f0f",
    theme_color: "#22c55e",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
