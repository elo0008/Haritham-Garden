import type { SiteSettings } from "@/lib/types";

interface FooterProps {
  settings?: SiteSettings;
}

export function Footer({ settings }: FooterProps) {
  const businessName = settings?.business_name || "Haritham Garden";
  const tagline = settings?.tagline || "Fresh plants & greens for your home";
  const locationText = settings?.location_text?.trim();
  const serviceAreaText = settings?.service_area_text?.trim();
  const instagramUrl = settings?.instagram_url?.trim();
  const contactPhone = settings?.contact_phone?.trim();

  return (
    <footer className="border-t border-stone-200/60 bg-[#FAF8F5] text-[#24211E] py-8 px-4 sm:px-6 lg:px-8 mt-12">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        {/* Left: Branding & Tagline */}
        <div className="space-y-1">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-base">🌿</span>
            <span className="font-bold text-sm text-[#24211E] tracking-tight">
              {businessName}
            </span>
          </div>
          {tagline && (
            <p className="text-xs text-stone-500 font-normal">
              {tagline}
            </p>
          )}
        </div>

        {/* Middle: Location & Service Area Trust Info */}
        {(locationText || serviceAreaText) && (
          <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-stone-600">
            {locationText && (
              <div className="flex items-center gap-1.5 bg-stone-200/40 px-3 py-1.5 rounded-full">
                <span>📍</span>
                <span>{locationText}</span>
              </div>
            )}
            {serviceAreaText && (
              <div className="flex items-center gap-1.5 bg-stone-200/40 px-3 py-1.5 rounded-full">
                <span>🚚</span>
                <span>{serviceAreaText}</span>
              </div>
            )}
          </div>
        )}

        {/* Right: Instagram & Contact */}
        <div className="flex items-center gap-4 text-xs font-medium text-stone-600">
          {contactPhone && (
            <div className="flex items-center gap-1">
              <span>📞</span>
              <span>{contactPhone}</span>
            </div>
          )}

          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-stone-700 hover:text-[#C1662F] transition-colors"
              aria-label="Instagram Profile"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>Instagram</span>
            </a>
          )}
        </div>
      </div>
      <div className="mx-auto max-w-7xl text-center mt-6 pt-4 border-t border-stone-200/40 text-[11px] text-stone-400">
        © {new Date().getFullYear()} {businessName}. All rights reserved.
      </div>
    </footer>
  );
}
