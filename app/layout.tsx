import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings().catch(() => null);
  const brand = s?.brand || "رحلات";
  return {
    title: { default: s?.seo.title || `${brand} — ${s?.tagline || "رحلات ترفيهية منظّمة"}`, template: `%s — ${brand}` },
    description: s?.seo.description || s?.about || "رحلات ترفيهية وسياحية منظّمة داخل المملكة",
    manifest: "/manifest.webmanifest",
    icons: { icon: "/icon.svg" },
    openGraph: { siteName: brand, locale: "ar_SA", type: "website" },
  };
}
export const viewport: Viewport = {
  themeColor: "#f7f3ec",
  width: "device-width", initialScale: 1, viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Baloo+Bhaijaan+2:wght@600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
