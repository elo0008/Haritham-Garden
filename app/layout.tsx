import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DisableNumberInputScroll } from "@/components/DisableNumberInputScroll";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Haritham Garden — Fresh Plants & Greens",
  description:
    "Haritham Garden offers nursery-fresh plants and greens for your home with WhatsApp ordering.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Haritham",
  },
  icons: {
    icon: "/api/pwa-icon?size=192",
    shortcut: "/api/pwa-icon?size=32",
    apple: "/api/pwa-icon?size=180",
  },
};

export const viewport: Viewport = {
  themeColor: "#1c382b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${outfit.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" type="image/png" sizes="32x32" href="/api/pwa-icon?size=32" />
        <link rel="icon" type="image/png" sizes="192x192" href="/api/pwa-icon?size=192" />
        <link rel="shortcut icon" href="/api/pwa-icon?size=32" />
        <link rel="apple-touch-icon" href="/api/pwa-icon?size=180" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Haritham" />
        <meta name="theme-color" content="#1c382b" />
      </head>
      <body className="min-h-full flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans transition-colors duration-300 overflow-x-clip w-full max-w-full">
        <ThemeProvider>
          <DisableNumberInputScroll />
          <CartProvider>{children}</CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
