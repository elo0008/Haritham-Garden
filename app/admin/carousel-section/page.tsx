import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CarouselAdminClient } from "./_components/CarouselAdminClient";
import type { CarouselSectionSettings, CarouselSlide } from "@/lib/types";

export const metadata = { title: "Carousel Section — Haritham Garden Admin" };

export default async function CarouselSectionAdminPage() {
  const supabase = await createClient();

  // Fetch section settings (singleton)
  const { data: settings, error: settingsError } = await supabase
    .from("carousel_section_settings")
    .select("*")
    .limit(1)
    .single();

  // Fetch all slides ordered by display_order
  const { data: slides, error: slidesError } = await supabase
    .from("carousel_slides")
    .select("*")
    .order("display_order", { ascending: true });

  if (settingsError || !settings) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-700">
          Failed to load carousel section settings. Make sure the migration has been run.
          {settingsError && <span className="block mt-1 font-mono">{settingsError.message}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-1">
        <Link
          href="/admin"
          className="text-xs text-stone-500 hover:text-stone-900 transition-colors"
        >
          ← Admin
        </Link>
      </div>
      <h1 className="text-xl font-bold text-[#24211E] mb-1">Carousel Section</h1>
      <p className="text-xs text-stone-500 mb-6">
        Configure the optional promotional/story carousel section for the homepage.
      </p>

      <CarouselAdminClient
        settings={settings as CarouselSectionSettings}
        slides={(slides as CarouselSlide[]) ?? []}
      />
    </div>
  );
}
