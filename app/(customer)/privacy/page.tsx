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
      {/* Main Content */}
      <main className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-10 w-full">
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
              At {businessName}, we respect your privacy. Our website does not require account registration or online payment card processing. When placing an order, customer delivery information (name, contact phone, shipping address, and pincode) may be optionally provided directly on our website or shared during your WhatsApp chat.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600 dark:text-stone-400">
              <li>Full Name and Contact Phone Number (optional)</li>
              <li>Delivery Shipping Address and Pincode (optional)</li>
              <li>Plant selection and order reference details</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
              2. How Orders & Payments Work
            </h2>
            <p>
              All customer orders are initiated on our website and finalized via WhatsApp. No direct credit/debit card payment processing takes place on this website. Pricing, shipping fees, payment methods (such as UPI/GPay/Bank Transfer), and delivery options are confirmed directly with you on WhatsApp prior to dispatch.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
              3. Delivery & Courier Partners
            </h2>
            <p>
              We fulfill orders across Kerala and South India primarily via DTDC courier and India Post. Your shipping address and contact phone number are shared strictly with our delivery partners solely to facilitate successful package delivery.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
              4. Data Protection & Usage
            </h2>
            <p>
              Any customer information collected through the website or WhatsApp is stored securely and used exclusively for order fulfillment, delivery tracking, and plant care customer support. We do not sell, rent, or trade your personal information with any third-party advertisers or brokers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
              5. Contact Us
            </h2>
            <p>
              If you have any questions regarding your order or privacy details, please reach out to us directly on WhatsApp or call us via the contact details listed on our website.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer settings={siteSettings} />
    </div>
  );
}
