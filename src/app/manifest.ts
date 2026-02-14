import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YKVM Staff MIS",
    short_name: "YKVM MIS",
    description: "Staff Management Information System for Yuva Kaushal Vikas Mandal",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/ykvm-logo.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
