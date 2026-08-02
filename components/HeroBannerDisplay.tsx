import type { HeroBanner } from "@/lib/types";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface HeroBannerDisplayProps {
  banner?: HeroBanner | null;
}

export function HeroBannerDisplay({ banner }: HeroBannerDisplayProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!banner || !banner.active) return null;

  const tagLabel = banner.tag_label?.trim();
  const title = banner.title?.trim();
  const description = banner.description?.trim();
  const bgImage = banner.background_image?.trim();

  // If active but no text fields exist at all, don't render an empty banner
  if (!tagLabel && !title && !description) return null;

  const handleScrollToGrid = () => {
    const element = document.getElementById("filter-bar");
    if (element) {
      const isMobile = window.innerWidth < 640;
      const headerHeight = isMobile ? 64 : 80;
      const gapMatchingBottomLine = 20; // Matches pb-5 (20px) gap between tags and separating line
      const offset = headerHeight + gapMatchingBottomLine;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative w-full h-[100svh] min-h-[100svh] text-white p-6 sm:p-12 mb-10 overflow-hidden shadow-lg bg-stone-900 border border-transparent dark:border-stone-800 flex flex-col justify-between pt-20 sm:pt-24 pb-8 sm:pb-12 rounded-none">
      {/* CSS Keyframe Style for Slow Ken Burns Zoom */}
      <style jsx>{`
        @keyframes kenBurnsZoom {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.08);
          }
        }
        .animate-ken-burns {
          animation: kenBurnsZoom 22s ease-in-out infinite alternate;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-ken-burns {
            animation: none !important;
            transform: scale(1) !important;
          }
        }
      `}</style>

      {/* Background Image or Solid Fallback with Ken Burns Zoom */}
      {bgImage ? (
        <img
          src={bgImage}
          alt={title || "Haritham Garden Banner"}
          className={`absolute inset-0 w-full h-full object-cover object-center ${
            shouldReduceMotion ? "" : "animate-ken-burns"
          }`}
          loading="eager"
        />
      ) : (
        <div
          className={`absolute inset-0 bg-botanical-900 ${
            shouldReduceMotion ? "" : "animate-ken-burns"
          }`}
        />
      )}

      {/* Gradient Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-botanical-950/60 via-botanical-950/45 to-stone-950/70 pointer-events-none" />

      {/* Content — Centered horizontally & vertically in space below header with staggered on-load entrance */}
      <div className="relative z-10 my-auto flex flex-col items-center text-center max-w-3xl mx-auto px-4">
        {tagLabel && (
          <motion.span
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
            className="bg-botanical-600/90 text-botanical-50 text-xs font-semibold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-4 inline-block backdrop-blur-xs shadow-2xs"
          >
            {tagLabel}
          </motion.span>
        )}
        {title && (
          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }}
            className="font-heading text-4xl sm:text-6xl font-bold tracking-tight mb-4 leading-tight text-white max-w-3xl"
          >
            {title}
          </motion.h1>
        )}
        {description && (
          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.25 }}
            className="text-botanical-100 text-base sm:text-lg font-normal leading-relaxed max-w-xl mb-6"
          >
            {description}
          </motion.p>
        )}

        {/* Explore Button */}
        <motion.button
          type="button"
          onClick={handleScrollToGrid}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.35 }}
          className="mt-4 sm:mt-6 group bg-white/90 hover:bg-white text-stone-900 font-bold px-6 py-3 rounded-full border border-white/30 backdrop-blur-md shadow-lg flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer text-sm"
        >
          <span>Explore</span>
          <ChevronDown className="w-4 h-4 text-stone-700 group-hover:translate-y-0.5 transition-transform" />
        </motion.button>
      </div>
    </div>
  );
}
