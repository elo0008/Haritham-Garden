import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import type { SiteSettings } from "@/lib/types";

export const metadata = {
  title: "Privacy Policy — Haritham Garden",
  description: "Privacy Policy for Haritham Garden plant nursery.",
};

export default async function PrivacyPage() {
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
    console.error("Privacy page settings error:", err);
  }

  const businessName = siteSettings?.business_name || "Haritham Garden";

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Logo
            showTagline={false}
            businessName={siteSettings?.business_name}
            logoUrl={siteSettings?.logo_url}
            href="/"
          />
          <Link
            href="/"
            className="text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-botanical-600 border border-stone-300 dark:border-stone-800 rounded-xl px-3 py-1.5 transition-colors"
          >
            ← Back to Shop
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Top Note */}
        <div className="mb-8 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 p-4 text-xs text-amber-900 dark:text-amber-300 font-medium">
          ℹ️ This is a general policy and may be updated. Contact us on WhatsApp with any questions.
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Privacy Policy
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-8">
          Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="space-y-6 text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-normal">
          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
              1. Information We Collect
            </h2>
            <p>
              At {businessName}, we respect your privacy. Our website does not require user account registration or collect credit card details online. When you place an order, you communicate directly with us via WhatsApp, where you share:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600 dark:text-stone-400">
              <li>Your Name and Contact Phone Number</li>
              <li>Your Delivery Shipping Address</li>
              <li>Your plant selection and order notes</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
              2. How Orders & Payments Work
            </h2>
            <p>
              All customer orders are initiated on our website and submitted via WhatsApp. No direct payment processing takes place on this website. Final pricing, payment methods (such as UPI/GPay/Bank Transfer), and delivery details are confirmed directly with you on WhatsApp prior to order dispatch.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
              3. Delivery & Courier Partners
            </h2>
            <p>
              We fulfill orders across Kerala and selected regions in South India primarily via DTDC courier and India Post. Your shipping address and contact number are shared strictly with our delivery partners to facilitate successful delivery.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
              4. Data Retention & Usage
            </h2>
            <p>
              Your contact details are used solely to fulfill your order, respond to inquiries, and provide nursery plant care guidance. We do not sell, rent, or trade your personal information to third parties or marketing brokers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
              5. Contact Us
            </h2>
            <p>
              If you have any questions regarding your order or privacy details, please reach out to us directly on WhatsApp or call us via the contact options listed on our website.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer settings={siteSettings} />
    </div>
  );
}
