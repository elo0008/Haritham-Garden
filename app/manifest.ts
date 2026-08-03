import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let appName = "Haritham Garden";

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase
        .from("site_settings")
        .select("business_name")
        .limit(1)
        .maybeSingle();

      if (data?.business_name?.trim()) {
        appName = data.business_name.trim();
      }
    }
  } catch (err) {
    console.error("Error fetching site settings for PWA manifest:", err);
  }

  return {
    name: `${appName} — Fresh Plants & Greens`,
    short_name: appName,
    description: "Nursery-fresh plants and greens for your home with WhatsApp ordering.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F5",
    theme_color: "#1c382b",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/api/pwa-icon?size=192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/pwa-icon?size=512&maskable=1",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
