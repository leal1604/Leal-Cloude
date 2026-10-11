import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Home Leal",
    short_name: "Home Leal",
    description: "Nossa casa, tudo organizado.",
    lang: "pt-PT",
    id: "/",
    start_url: "/",
    scope: "/",
    categories: ["shopping", "lifestyle", "productivity"],
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5efe5",
    theme_color: "#637657",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      { src: "/screenshots/inicio.png", sizes: "1080x1920", type: "image/png", form_factor: "narrow", label: "Resumo da lista" },
      { src: "/screenshots/lista.png", sizes: "1080x1920", type: "image/png", form_factor: "narrow", label: "Lista por departamento" },
    ],
  };
}
