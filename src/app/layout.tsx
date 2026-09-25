import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Fuentes auto-alojadas (variables, subset latin, licencia OFL) para no depender
// de Google Fonts en build: así compila también en redes restringidas.
const inter = localFont({
  src: "./fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "./fonts/JetBrainsMono-Variable.woff2",
  variable: "--font-jetbrains-mono",
  weight: "100 800",
  display: "swap",
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { template: "%s · Nodo Trading", default: "Nodo Trading" },
  description: "Terminal de inversores BYMA y CEDEARs.",
  openGraph: {
    title: "Nodo Trading",
    description: "Terminal de inversores BYMA y CEDEARs.",
    siteName: "Nodo Trading",
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
