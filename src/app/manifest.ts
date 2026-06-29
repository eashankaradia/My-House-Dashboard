import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My House Dashboard",
    short_name: "My House",
    description: "Your premium home command centre.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#10b981",
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
