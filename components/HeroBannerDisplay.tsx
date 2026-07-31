import type { HeroBanner } from "@/lib/types";
import { motion, useReducedMotion } from "framer-motion";

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

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="relative rounded-3xl text-white p-8 sm:p-12 mb-10 overflow-hidden shadow-lg bg-stone-900 border border-transparent dark:border-stone-800"
    >
      {/* CSS Keyframe Style for Ambient Slow Drift */}
      <style jsx>{`
        @keyframes ambientLeafDrift {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(18px, -14px, 0) rotate(6deg);
          }
          100% {
            transform: translate3d(-10px, 8px, 0) rotate(-4deg);
          }
        }
        .animate-ambient-leaf {
          animation: ambientLeafDrift 38s ease-in-out infinite alternate;
          will-change: transform;
        }
      `}</style>

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

      {/* Single Ambient Botanical Leaf Background Accent (Pure CSS 4% opacity, slow drift) */}
      <div className="absolute -right-8 -bottom-12 z-0 pointer-events-none opacity-[0.05] text-white animate-ambient-leaf select-none hidden sm:block">
        <svg
          width="320"
          height="320"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-xl">
        {tagLabel && (
          <span className="bg-botanical-600/90 text-botanical-50 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block backdrop-blur-xs shadow-2xs">
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
    </motion.div>
  );
}
