"use client";

import { useState, useRef } from "react";
import type { CarouselSectionSettings, CarouselSlide } from "@/lib/types";

interface CarouselSectionProps {
  settings?: CarouselSectionSettings;
  slides?: CarouselSlide[];
}

export function CarouselSection({ settings, slides }: CarouselSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Touch swipe refs
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // If section is disabled or no settings exist, render NOTHING
  if (!settings || !settings.enabled) return null;

  // Filter only active slides
  const activeSlides = (slides ?? []).filter((s) => s.active);

  // If enabled but zero active slides, prefer hiding entirely to avoid broken UI
  if (activeSlides.length === 0) return null;

  // Ensure current index is within bounds
  const safeIndex = Math.min(currentIndex, activeSlides.length - 1);
  const currentSlide = activeSlides[safeIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === activeSlides.length - 1 ? 0 : prev + 1));
  };

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
      // Swiped left → Next
      handleNext();
    } else if (diff < -minSwipeDistance) {
      // Swiped right → Prev
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const headerTag = settings.header_tag?.trim();
  const headerTitle = settings.header_title?.trim();
  const headerSubtitle = settings.header_subtitle?.trim();

  return (
    <section className="my-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* ── Section Header ────────────────────────────────────────────────── */}
      {(headerTag || headerTitle || headerSubtitle) && (
        <div className="mb-6 text-center sm:text-left">
          {headerTag && (
            <span className="inline-block mb-2 rounded-full bg-[#C1662F]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#C1662F]">
              {headerTag}
            </span>
          )}
          {headerTitle && (
            <h2 className="text-2xl sm:text-3xl font-bold text-[#24211E] tracking-tight">
              {headerTitle}
            </h2>
          )}
          {headerSubtitle && (
            <p className="mt-1 text-sm text-stone-500 max-w-2xl leading-relaxed">
              {headerSubtitle}
            </p>
          )}
        </div>
      )}

      {/* ── Carousel Slide Container ──────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl border border-stone-200/80 shadow-md select-none touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ minHeight: 300 }}
      >
        {/* Background Image / Solid Fallback */}
        {currentSlide.background_image ? (
          <img
            src={currentSlide.background_image}
            alt={currentSlide.title}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0 bg-stone-800" />
        )}

        {/* Dark Gradient Overlay for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

        {/* Slide Content */}
        <div
          className="relative z-10 p-6 sm:p-10 flex flex-col justify-end"
          style={{ minHeight: 300 }}
        >
          <div className="max-w-xl pb-6">
            {currentSlide.tag_label?.trim() && (
              <span className="inline-block mb-2.5 rounded-full bg-[#C1662F] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs">
                {currentSlide.tag_label.trim()}
              </span>
            )}
            <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2">
              {currentSlide.title}
            </h3>
            <p className="text-sm sm:text-base text-stone-200 leading-relaxed">
              {currentSlide.description}
            </p>
          </div>
        </div>

        {/* ── Navigation Arrows (Only if > 1 slide) ────────────────────────── */}
        {activeSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-all active:scale-95 min-h-[44px] min-w-[44px]"
              aria-label="Previous slide"
            >
              ←
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-all active:scale-95 min-h-[44px] min-w-[44px]"
              aria-label="Next slide"
            >
              →
            </button>
          </>
        )}

        {/* ── Pagination Indicators / Dots ───────────────────────────────── */}
        {activeSlides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === safeIndex
                    ? "w-6 bg-[#C1662F]"
                    : "w-2 bg-white/60 hover:bg-white"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
