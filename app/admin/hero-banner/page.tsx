import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HeroBannerForm } from "./_components/HeroBannerForm";
import type { HeroBanner } from "@/lib/types";

export const metadata = { title: "Hero Banner — Haritham Garden Admin" };

export default async function HeroBannerPage() {
  const supabase = await createClient();

  const { data: banner, error } = await supabase
    .from("hero_banner")
    .select("*")
    .limit(1)
    .single();

  if (error || !banner) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-700">
          Failed to load hero banner. Make sure the migration has been run.
          {error && <span className="block mt-1 font-mono">{error.message}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Link
          href="/admin"
          className="text-xs text-stone-500 hover:text-stone-900 transition-colors"
        >
          ← Admin
        </Link>
      </div>
      <h1 className="text-xl font-bold text-[#24211E] mb-1">Hero Banner</h1>
      <p className="text-xs text-stone-500 mb-6">
        Configure the promotional banner shown at the top of the homepage.
      </p>
      <HeroBannerForm banner={banner as HeroBanner} />
    </div>
  );
}
