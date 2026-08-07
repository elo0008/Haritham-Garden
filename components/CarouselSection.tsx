"use client";

import { useState, useEffect, useCallback } from "react";
import type { CarouselSectionSettings, CarouselSlide } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { FloatingLeaves } from "./FloatingLeaves";

interface CarouselSectionProps {
  settings?: CarouselSectionSettings;
  slides?: CarouselSlide[];
}

export function CarouselSection({ settings, slides }: CarouselSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const activeSlides = (slides ?? []).filter((s) => s.active);

  const triggerSlideChange = useCallback(
    (targetIndex: number | ((prev: number) => number)) => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => {
          if (typeof targetIndex === "function") {
            return targetIndex(prev);
          }
          return targetIndex;
        });
        setIsFading(false);
      }, 180);
    },
    []
  );

  const handleNext = useCallback(() => {
    if (activeSlides.length <= 1) return;
    triggerSlideChange((prev) => (prev >= activeSlides.length - 1 ? 0 : prev + 1));
  }, [activeSlides.length, triggerSlideChange]);

  const handlePrev = useCallback(() => {
    if (activeSlides.length <= 1) return;
    triggerSlideChange((prev) => (prev <= 0 ? activeSlides.length - 1 : prev - 1));
  }, [activeSlides.length, triggerSlideChange]);

  // Auto-advance timer (every 5s, loops infinitely, resets on manual navigation or hover)
  useEffect(() => {
    if (!settings?.enabled || activeSlides.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      triggerSlideChange((prev) => (prev >= activeSlides.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [settings?.enabled, activeSlides.length, isHovered, currentIndex, triggerSlideChange]);

  const shouldReduceMotion = useReducedMotion();

  // If section is disabled or no settings exist, render NOTHING
  if (!settings || !settings.enabled || activeSlides.length === 0) return null;

  // Ensure current index is within bounds
  const safeIndex = Math.min(currentIndex, activeSlides.length - 1);
  const currentSlide = activeSlides[safeIndex];

  const headerTag = settings.header_tag?.trim();
  const headerTitle = settings.header_title?.trim();
  const headerSubtitle = settings.header_subtitle?.trim();

  // Helper to fix typo "amoung" -> "among" at render source
  const sanitizeText = (str?: string | null) => {
    if (!str) return "";
    return str.replace(/\bamoung\b/gi, "among");
  };

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 40;
    const velocityThreshold = 300;
    if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      handleNext();
    } else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      handlePrev();
    }
  };

  return (
    <motion.section
      id="carousel-section"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full mb-16 pt-8 border-t border-stone-200 dark:border-stone-800 relative overflow-hidden"
    >
      <FloatingLeaves />
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

      {/* ── Section Header (if configured) ────────────────────────────────── */}
      {(headerTag || headerTitle || headerSubtitle) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-10">
          <div className="text-center max-w-2xl mx-auto">
            {headerTag && (
              <span className="text-xs font-bold uppercase tracking-wider text-botanical-600 dark:text-botanical-100 bg-botanical-50 dark:bg-stone-900 border border-botanical-100 dark:border-stone-800 px-3 py-1 rounded-full inline-block mb-3">
                {headerTag}
              </span>
            )}
            {headerTitle && (
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-stone-900 dark:text-stone-100">
                {headerTitle}
              </h2>
            )}
            {headerSubtitle && (
              <p className="text-stone-500 dark:text-stone-400 text-sm mt-2 leading-relaxed">
                {headerSubtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Full-Bleed Carousel Container (Capped at ~50-55vh) ──────────────── */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-full h-[50vh] sm:h-[55vh] min-h-[380px] sm:min-h-[440px] max-h-[540px] text-white overflow-hidden shadow-lg bg-stone-900 border-y border-stone-200/50 dark:border-stone-800/50 flex items-center justify-between group select-none touch-pan-y rounded-none"
      >
        {/* Drag Container */}
        <motion.div
          key={currentSlide.id}
          drag={activeSlides.length > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="relative w-full h-full flex flex-col justify-end items-start cursor-grab active:cursor-grabbing"
        >
          {/* Background Image with Clean Ken Burns Zoom restarting on slide change */}
          {currentSlide.background_image ? (
            <img
              key={currentSlide.id}
              src={currentSlide.background_image}
              alt={sanitizeText(currentSlide.title)}
              style={{
                objectPosition: `${currentSlide.focal_point_x ?? 50}% ${currentSlide.focal_point_y ?? 50}%`,
              }}
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-500 ${
                shouldReduceMotion ? "" : "animate-ken-burns"
              } ${isFading ? "opacity-30" : "opacity-100"}`}
              loading="eager"
            />
          ) : (
            <div className="absolute inset-0 bg-stone-900 pointer-events-none" />
          )}

          {/* Gradient Scrim Overlay for Legibility (Bottom-left focused) */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/50 to-transparent sm:bg-gradient-to-tr sm:from-stone-950/90 sm:via-stone-950/50 sm:to-transparent pointer-events-none" />

          {/* Bottom-Left Aligned Slide Content matching Hero typography scale & badges */}
          <div
            className={`relative z-10 max-w-2xl px-6 sm:px-12 md:pl-16 pb-14 sm:pb-16 pt-8 text-left flex flex-col items-start transition-opacity duration-300 pointer-events-none ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            {currentSlide.tag_label?.trim() && (
              <span className="bg-botanical-600/90 text-botanical-50 text-xs font-semibold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-3.5 inline-block backdrop-blur-xs shadow-2xs">
                {sanitizeText(currentSlide.tag_label.trim())}
              </span>
            )}
            <h3 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight mb-3 sm:mb-4 leading-tight text-white max-w-2xl drop-shadow-sm">
              {sanitizeText(currentSlide.title)}
            </h3>
            <p className="text-stone-200 text-sm sm:text-base font-normal leading-relaxed max-w-xl drop-shadow-sm">
              {sanitizeText(currentSlide.description)}
            </p>
          </div>
        </motion.div>

        {/* ── Desktop Navigation Arrows (hidden on mobile to prevent text overlap) ───── */}
        {activeSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="hidden md:flex absolute left-6 z-20 w-11 h-11 rounded-full bg-white/20 hover:bg-white/90 hover:text-stone-900 text-white items-center justify-center backdrop-blur-md transition-all shadow-md opacity-75 hover:opacity-100 min-h-[44px] min-w-[44px] active:scale-90 cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="hidden md:flex absolute right-6 z-20 w-11 h-11 rounded-full bg-white/20 hover:bg-white/90 hover:text-stone-900 text-white items-center justify-center backdrop-blur-md transition-all shadow-md opacity-75 hover:opacity-100 min-h-[44px] min-w-[44px] active:scale-90 cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* ── Pagination Dots (Visible & Clickable on Desktop and Mobile) ────────── */}
        {activeSlides.length > 1 && (
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 bg-stone-950/50 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/10">
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => triggerSlideChange(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 min-w-[10px] cursor-pointer ${
                  idx === safeIndex
                    ? "w-6 bg-terracotta"
                    : "w-2.5 bg-white/60 hover:bg-white"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
