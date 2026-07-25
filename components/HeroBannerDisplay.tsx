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
    <section className="relative overflow-hidden w-full" style={{ minHeight: 200 }}>
      {/* Background Image or Solid Fallback */}
      {bgImage ? (
        <img
          src={bgImage}
          alt={title || "Haritham Garden Banner"}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
      ) : (
        <div className="absolute inset-0 bg-stone-800" />
      )}

      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/40 to-stone-950/20" />

      {/* Content */}
      <div
        className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col justify-end"
        style={{ minHeight: 200 }}
      >
        <div className="pb-6 pt-10 sm:pb-8 sm:pt-14">
          {tagLabel && (
            <span className="inline-block mb-2 rounded-full bg-[#C1662F] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs">
              {tagLabel}
            </span>
          )}
          {title && (
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-1.5">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm sm:text-base text-stone-200 max-w-xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
