import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import type { SiteSettings } from "@/lib/types";

export const metadata = {
  title: "Terms of Service — Haritham Garden",
  description: "Terms of Service for Haritham Garden plant nursery.",
};

export default async function TermsPage() {
  const supabase = await createClient();

  let siteSettings: SiteSettings | undefined = undefined;
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (data) siteSettings = data as SiteSettings;
  } catch (err) {
    console.error("Terms page settings error:", err);
  }

  const businessName = siteSettings?.business_name || "Haritham Garden";

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans antialiased">
      {/* Main Content */}
      <main className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-10 w-full">
        {/* Top Note */}
        <div className="mb-8 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 p-4 text-xs text-amber-900 dark:text-amber-300 font-medium">
          ℹ️ This is a general policy and may be updated. Contact us on WhatsApp with any questions.
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Terms of Service
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-8">
          Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="space-y-6 text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-normal">
          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
              1. General Ordering Terms
            </h2>
            <p>
              By browsing and placing orders with {businessName}, you agree to our purchasing process. Our website catalog acts as a nursery showcase. Selecting items builds an order message that is sent via WhatsApp to confirm plant stock and delivery details.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
              2. Plant Availability & Natural Variations
            </h2>
            <p>
              Plants are natural living products. While we ensure all plants dispatched are nursery-fresh and healthy, slight variations in size, foliage density, and spathe color shade compared to catalog photographs are natural.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
              3. Delivery & Courier Shipping
            </h2>
            <p>
              Orders are packaged in protective eco-friendly packaging and shipped via DTDC courier or India Post across Kerala and parts of South India. Delivery charges are calculated based on parcel weight and destination location, confirmed via WhatsApp before payment.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
              4. Returns & Damage Replacements
            </h2>
            <p>
              Due to the perishable nature of live plants, standard returns or exchanges are not accepted once delivered. However, if your plant arrives severely damaged due to courier transit, please notify us on WhatsApp within 24 hours of delivery along with clear unboxing photos/videos so we can provide a replacement or resolution.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
              5. Customer Support
            </h2>
            <p>
              We are committed to helping your plants thrive! For any care advice, order tracking, or assistance, reach out to us via our official WhatsApp number anytime.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer settings={siteSettings} />
    </div>
  );
}
