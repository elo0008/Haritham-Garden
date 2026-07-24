"use client";

import { useState, useEffect } from "react";
import type { Plant } from "@/lib/types";
import { formatINR } from "@/lib/utils";

interface PlantBottomSheetProps {
  plant: Plant | null;
  onClose: () => void;
  onAddToCart?: (plant: Plant, qty: number) => void;
}

const SUNLIGHT_LABELS: Record<string, string> = {
  low: "Low Light",
  medium: "Medium Light",
  full_sun: "Full Sun",
};

const WATERING_LABELS: Record<string, string> = {
  low: "Low Water",
  medium: "Medium Water",
  high: "High Water",
};

export function PlantBottomSheet({ plant, onClose, onAddToCart }: PlantBottomSheetProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  // Reset internal state when a new plant is opened
  useEffect(() => {
    setActivePhotoIndex(0);
    setQuantity(1);
    setAddedToast(false);
  }, [plant?.id]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (plant) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [plant, onClose]);

  if (!plant) return null;

  const isUnavailable = plant.availability === "unavailable";
  const photos = plant.photos && plant.photos.length > 0 ? plant.photos : [];

  const handleAddToCart = () => {
    onAddToCart?.(plant, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content */}
      <div
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#FAF8F5] p-6 shadow-2xl transition-transform animate-in slide-in-from-bottom duration-300 text-[#24211E]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
      >
        {/* Top Handle Bar for Touch */}
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-stone-300/80 sm:hidden" />

        {/* Close Button (Min 44x44px tap target) */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-stone-900/40 text-white hover:bg-stone-900/70 backdrop-blur-md transition-colors"
          aria-label="Close details"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Photo Gallery Carousel */}
        <div className="relative mb-5 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-stone-200/60 shadow-2xs">
          {photos.length > 0 ? (
            <img
              src={photos[activePhotoIndex]}
              alt={plant.name}
              className="h-full w-full object-cover transition-all duration-300"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-300">
              <svg className="h-16 w-16 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
          )}

          {/* Photo Dots / Nav if multiple photos */}
          {photos.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 z-10">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`h-2.5 rounded-full transition-all min-w-[20px] ${
                    idx === activePhotoIndex
                      ? "w-6 bg-[#C1662F]"
                      : "w-2.5 bg-white/80 hover:bg-white"
                  }`}
                  aria-label={`Go to photo ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Plant Header Info */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="bottom-sheet-title" className="text-xl font-bold text-[#24211E] sm:text-2xl">
                {plant.name}
              </h2>
              {plant.local_name && (
                <p className="text-sm font-medium text-stone-500">{plant.local_name}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-[#24211E]">
                {formatINR(plant.price)}
              </span>
            </div>
          </div>
        </div>

        {/* Plant Attribute Badges (Sunlight & Water) */}
        <div className="mb-5 flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-stone-200/60 px-3 py-1.5 text-xs font-medium text-stone-700">
            <span>☀️</span>
            <span>{SUNLIGHT_LABELS[plant.sunlight] || plant.sunlight}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-stone-200/60 px-3 py-1.5 text-xs font-medium text-stone-700">
            <span>💧</span>
            <span>{WATERING_LABELS[plant.watering] || plant.watering}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-stone-200/60 px-3 py-1.5 text-xs font-medium text-stone-700 capitalize">
            <span>🪴</span>
            <span>{plant.category}</span>
          </div>
        </div>

        {/* Description */}
        {plant.description && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
              About this plant
            </h3>
            <p className="text-sm text-stone-700 leading-relaxed">
              {plant.description}
            </p>
          </div>
        )}

        {/* Toast Alert */}
        {addedToast && (
          <div className="mb-3 rounded-xl bg-emerald-800 text-white px-4 py-2.5 text-xs font-medium text-center shadow-xs animate-in fade-in duration-200">
            Added {quantity} x {plant.name} to cart!
          </div>
        )}

        {/* Action Bar (Stepper + Add to Cart or Unavailable Note) */}
        <div className="border-t border-stone-200/70 pt-4">
          {isUnavailable ? (
            <div className="rounded-xl bg-stone-200/60 py-3.5 text-center text-sm font-medium text-stone-600">
              Currently unavailable
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Stepper (Min 44x44px buttons) */}
              <div className="flex items-center rounded-xl bg-stone-200/60 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#24211E] hover:bg-stone-100 active:bg-stone-200 font-bold text-base transition-colors disabled:opacity-40"
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-9 text-center text-sm font-bold text-[#24211E]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#24211E] hover:bg-stone-100 active:bg-stone-200 font-bold text-base transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button (Min 48px height) */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 min-h-[48px] rounded-xl bg-[#C1662F] py-3.5 px-4 text-center text-sm font-semibold text-white shadow-xs hover:bg-[#A85524] active:bg-[#92481e] transition-colors"
              >
                Add to Cart — {formatINR(plant.price * quantity)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
