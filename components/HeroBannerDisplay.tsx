import type { HeroBanner } from "@/lib/types";

interface HeroBannerDisplayProps {
  banner: HeroBanner;
}

export function HeroBannerDisplay({ banner }: HeroBannerDisplayProps) {
  // Don't render if banner is inactive or has no meaningful content
  if (!banner.active) return null;
  if (!banner.title && !banner.description && !banner.tag_label) return null;

  return (
    <section className="relative overflow-hidden" style={{ minHeight: 220 }}>
      {/* Background */}
      {banner.background_image ? (
        <img
          src={banner.background_image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-300 to-stone-400" />
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Content */}
      <div
        className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col justify-end"
        style={{ minHeight: 220 }}
      >
        <div className="pb-7 pt-14 sm:pb-9 sm:pt-20">
          {banner.tag_label && (
            <span className="inline-block mb-2.5 rounded-full bg-[#C1662F] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs">
              {banner.tag_label}
            </span>
          )}
          {banner.title && (
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-1.5">
              {banner.title}
            </h2>
          )}
          {banner.description && (
            <p className="text-sm sm:text-base text-white/80 max-w-lg leading-relaxed">
              {banner.description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
