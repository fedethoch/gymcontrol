import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GymControl",
    short_name: "GymControl",
    description: "Panel operativo de entrenamiento y nutricion.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#05070b",
    theme_color: "#05070b",
    orientation: "portrait",
    icons: [
      {
        src: "/logo/logo-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo/logo-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
