import { createClient } from "@/lib/supabase/server";
import { CustomerHeader } from "@/components/CustomerHeader";
import { CartDrawer } from "@/components/CartDrawer";
import { PWAProvider } from "@/components/PWAProvider";
import type { SiteSettings, CarouselSectionSettings } from "@/lib/types";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const [{ data: siteSettings }, { data: carouselSettings }] = await Promise.all([
    supabase.from("site_settings").select("*").limit(1).maybeSingle(),
    supabase.from("carousel_section_settings").select("*").limit(1).maybeSingle(),
  ]);

  const carouselTagLabel = carouselSettings?.enabled
    ? carouselSettings.header_tag?.trim() || "Featured"
    : null;

  return (
    <div className="bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans antialiased min-h-screen flex flex-col relative transition-colors duration-300">
      <CustomerHeader
        siteSettings={siteSettings as SiteSettings | null}
        carouselTagLabel={carouselTagLabel}
      />
      <div className="flex-1 flex flex-col">{children}</div>
      <CartDrawer whatsappNumber={siteSettings?.whatsapp_number} />
      <PWAProvider />
    </div>
  );
}
