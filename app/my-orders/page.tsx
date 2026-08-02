import { createClient } from "@/lib/supabase/server";
import { MyOrdersClient } from "./_components/MyOrdersClient";
import type { Plant, SiteSettings, CarouselSectionSettings } from "@/lib/types";

export const metadata = {
  title: "My Orders | Haritham Garden",
  description: "View and manage your plant orders placed with Haritham Garden.",
};

export default async function MyOrdersPage() {
  const supabase = await createClient();

  // 1. Fetch site settings
  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  // 2. Fetch carousel section settings (for header nav tag)
  const { data: carouselSettings } = await supabase
    .from("carousel_section_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  // 3. Fetch plants catalogue (for plant picker in edit mode)
  const { data: plantsData } = await supabase
    .from("plants")
    .select(`
      *,
      plant_tags (
        tags (
          id,
          name,
          slug
        )
      )
    `)
    .order("created_at", { ascending: false });

  const plants: Plant[] = (plantsData ?? []).map((p: any) => ({
    ...p,
    tags: p.plant_tags ? p.plant_tags.map((pt: any) => pt.tags).filter(Boolean) : [],
  }));

  return (
    <MyOrdersClient
      siteSettings={siteSettings as SiteSettings | null}
      carouselSettings={carouselSettings as CarouselSectionSettings | null}
      plants={plants}
    />
  );
}
