import type { HeroBanner } from "@/lib/types";

interface HeroBannerDisplayProps {
  banner?: HeroBanner | null;
}

export function HeroBannerDisplay({ banner }: HeroBannerDisplayProps) {
  if (!banner || !banner.active) return null;

  const tagLabel = banner.tag_label?.trim();
  const title = banner.title?.trim();
  const description = banner.description?.trim();
  const bgImage = banner.background_image?.trim();

  // If active but no text fields exist at all, don't render an empty banner
  if (!tagLabel && !title && !description) return null;

  return (
    <div className="relative rounded-3xl text-white p-8 sm:p-12 mb-10 overflow-hidden shadow-lg bg-stone-900 border border-transparent dark:border-stone-800">
      {/* Background Image or Solid Fallback */}
      {bgImage ? (
        <img
          src={bgImage}
          alt={title || "Haritham Garden Banner"}
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="eager"
        />
      ) : (
        <div className="absolute inset-0 bg-botanical-900" />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-botanical-900/45 via-botanical-900/40 to-botanical-800/35" />

      {/* Content */}
      <div className="relative z-10 max-w-xl">
        {tagLabel && (
          <span className="bg-botanical-600/90 text-botanical-50 border border-botanical-500/30 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block backdrop-blur-xs shadow-2xs">
            {tagLabel}
          </span>
        )}
        {title && (
          <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight text-white">
            {title}
          </h1>
        )}
        {description && (
          <p className="text-botanical-100 text-sm sm:text-base font-normal leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
