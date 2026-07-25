import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./_components/SettingsForm";
import type { SiteSettings } from "@/lib/types";

export const metadata = { title: "Settings — Haritham Garden Admin" };

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: settings, error } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .single();

  if (error || !settings) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-700">
          Failed to load settings. Make sure the migration has been run.
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
      <h1 className="text-xl font-bold text-[#24211E] mb-1">Site Settings</h1>
      <p className="text-xs text-stone-500 mb-6">
        Manage branding, logo image, header text, and customer order WhatsApp number.
      </p>
      <SettingsForm settings={settings as SiteSettings} />
    </div>
  );
}
