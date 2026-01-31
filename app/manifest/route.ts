import { NextResponse } from "next/server";

export function GET() {
  const manifest = {
    name: "Academia Nutricional - Treino e Saúde Diária",
    short_name: "Academia Nutricional",
    theme_color: "#16a34a",
    background_color: "#ffffff",
    display: "standalone" as const,
    start_url: "/",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
