"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CarouselSectionSettings, CarouselSlide } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

interface CarouselSectionProps {
  settings?: CarouselSectionSettings;
  slides?: CarouselSlide[];
}

export function CarouselSection({ settings, slides }: CarouselSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFading, setIsFading] = useState(false);

  // Touch swipe refs
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

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

  // Auto-advance timer (every 5s, loops infinitely, pauses on hover)
  useEffect(() => {
    if (!settings?.enabled || activeSlides.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      triggerSlideChange((prev) => (prev >= activeSlides.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [settings?.enabled, activeSlides.length, isHovered, triggerSlideChange]);

  // If section is disabled or no settings exist, render NOTHING
  if (!settings || !settings.enabled || activeSlides.length === 0) return null;

  // Ensure current index is within bounds
  const safeIndex = Math.min(currentIndex, activeSlides.length - 1);
  const currentSlide = activeSlides[safeIndex];

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (diff > minSwipeDistance) {
      handleNext();
    } else if (diff < -minSwipeDistance) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const shouldReduceMotion = useReducedMotion();

  const headerTag = settings.header_tag?.trim();
  const headerTitle = settings.header_title?.trim();
  const headerSubtitle = settings.header_subtitle?.trim();

  return (
    <motion.section
      id="carousel-section"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="mb-16 pt-8 border-t border-stone-200 dark:border-stone-800"
    >
      {/* ── Section Header ────────────────────────────────────────────────── */}
      {(headerTag || headerTitle || headerSubtitle) && (
        <div className="text-center max-w-2xl mx-auto mb-10">
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
      )}

      {/* ── Carousel Slide Container ──────────────────────────────────────── */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative rounded-3xl overflow-hidden shadow-xl bg-stone-900 border border-transparent dark:border-stone-800 min-h-[380px] sm:min-h-[440px] flex items-center justify-between group touch-pan-y select-none"
      >
        {/* Background Image / Solid Fallback */}
        {currentSlide.background_image ? (
          <img
            src={currentSlide.background_image}
            alt={currentSlide.title}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-500 transform scale-100 group-hover:scale-105 ${
              isFading ? "opacity-30" : "opacity-100"
            }`}
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0 bg-stone-900" />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/45 to-transparent" />

        {/* Slide Content */}
        <div
          className={`relative z-10 max-w-xl p-8 sm:p-12 sm:pl-16 text-white transition-opacity duration-300 ${
            isFading ? "opacity-0" : "opacity-100"
          }`}
        >
          {currentSlide.tag_label?.trim() && (
            <span className="bg-botanical-600 text-botanical-50 font-semibold text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block shadow-sm">
              {currentSlide.tag_label.trim()}
            </span>
          )}
          <h3 className="font-heading text-2xl sm:text-4xl font-bold tracking-tight mb-4 leading-tight text-white drop-shadow-sm">
            {currentSlide.title}
          </h3>
          <p className="text-stone-200 text-sm sm:text-base font-normal leading-relaxed drop-shadow-sm">
            {currentSlide.description}
          </p>
        </div>

        {/* ── Navigation Arrows ────────────────────────────────────────────── */}
        {activeSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-4 z-20 w-11 h-11 rounded-full bg-white/20 hover:bg-white/90 hover:text-stone-900 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md opacity-75 hover:opacity-100 min-h-[44px] min-w-[44px] active:scale-90"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 z-20 w-11 h-11 rounded-full bg-white/20 hover:bg-white/90 hover:text-stone-900 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md opacity-75 hover:opacity-100 min-h-[44px] min-w-[44px] active:scale-90"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* ── Pagination Dots ──────────────────────────────────────────────── */}
        {activeSlides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 bg-stone-950/40 px-3 py-1.5 rounded-full backdrop-blur-md">
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => triggerSlideChange(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === safeIndex
                    ? "w-6 bg-terracotta"
                    : "w-2 bg-white/60 hover:bg-white"
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
