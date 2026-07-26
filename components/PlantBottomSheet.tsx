"use client";

import { useState, useEffect } from "react";
import type { Plant } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Sun, Droplet, Compass, ShoppingBag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  const isUnavailable = plant?.availability === "unavailable";
  const photos = plant?.photos && plant.photos.length > 0 ? plant.photos : [];

  const handleAddToCart = () => {
    if (!plant) return;
    onAddToCart?.(plant, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  return (
    <AnimatePresence>
      {plant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-10 w-full max-w-4xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-100 dark:border-stone-800 overflow-hidden flex flex-col md:flex-row max-h-[90vh] text-stone-900 dark:text-stone-100"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-stone-900/40 hover:bg-stone-900/80 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md min-h-[44px] min-w-[44px] active:scale-90"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Side: Photo Gallery */}
            <div className="md:w-1/2 relative bg-stone-100 dark:bg-stone-800 min-h-[260px] sm:min-h-[340px] md:min-h-full flex items-center justify-center">
              {photos.length > 0 ? (
                <img
                  src={photos[activePhotoIndex]}
                  alt={plant.name}
                  className="w-full h-full object-cover absolute inset-0 transition-opacity duration-300"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-stone-300 dark:text-stone-600 text-6xl">
                  🌿
                </div>
              )}

              {/* Photo Dots Nav if multiple photos */}
              {photos.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 z-10">
                  {photos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`h-2.5 rounded-full transition-all min-w-[20px] ${
                        idx === activePhotoIndex
                          ? "w-6 bg-terracotta"
                          : "w-2.5 bg-white/80 hover:bg-white"
                      }`}
                      aria-label={`Go to photo ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Side: Details & Controls */}
            <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[500px] md:max-h-full">
              <div>
                {/* Tag Badges / Availability */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-botanical-600 dark:text-botanical-100 bg-botanical-50 dark:bg-stone-800 px-3 py-1 rounded-md border border-botanical-100 dark:border-stone-700 inline-block">
                    {plant.tags && plant.tags.length > 0 ? plant.tags[0].name : "Plant"}
                  </span>
                  {isUnavailable && (
                    <span className="text-xs font-bold uppercase tracking-wider bg-rose-600 text-white px-3 py-1 rounded-full shadow-sm">
                      Out of Stock
                    </span>
                  )}
                </div>

                <h2 id="product-modal-title" className="font-heading font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
                  {plant.name}
                </h2>
                {plant.local_name && (
                  <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-0.5">
                    {plant.local_name}
                  </p>
                )}

                <span className="font-heading font-bold text-2xl text-stone-900 dark:text-stone-100 block my-3">
                  {formatINR(plant.price)}
                </span>

                {/* Plant Care Attributes Grid */}
                <div className="grid grid-cols-3 gap-2.5 mb-6">
                  <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 text-center">
                    <Sun className="w-4 h-4 text-amber-600 dark:text-amber-500 mb-1" />
                    <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                      {SUNLIGHT_LABELS[plant.sunlight] || plant.sunlight}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40 text-center">
                    <Droplet className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-1" />
                    <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                      {WATERING_LABELS[plant.watering] || plant.watering}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-botanical-50/60 dark:bg-stone-800/80 border border-botanical-100 dark:border-stone-700 text-center">
                    <Compass className="w-4 h-4 text-botanical-600 dark:text-botanical-100 mb-1" />
                    <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                      {plant.shippable ? "Shippable" : "Local Only"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {plant.description && (
                  <p className="text-stone-600 dark:text-stone-300 text-sm leading-relaxed mb-6 font-normal">
                    {plant.description}
                  </p>
                )}
              </div>

              {/* Toast Notification */}
              {addedToast && (
                <div className="mb-3 rounded-xl bg-emerald-800 text-white px-4 py-2.5 text-xs font-semibold text-center shadow-xs animate-in fade-in duration-200">
                  Added {quantity} x {plant.name} to bag!
                </div>
              )}

              {/* Bottom Action Footer */}
              <div className="pt-6 border-t border-stone-100 dark:border-stone-800 flex items-center gap-4 mt-auto shrink-0">
                {isUnavailable ? (
                  <div className="w-full rounded-2xl bg-stone-100 dark:bg-stone-800/50 py-3.5 text-center text-sm font-semibold text-stone-400 dark:text-stone-500">
                    Currently Out of Stock
                  </div>
                ) : (
                  <>
                    {/* Stepper */}
                    <div className="flex items-center border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 rounded-2xl p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-300 font-bold text-base disabled:opacity-40 hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-90 transition-all"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-sm text-stone-800 dark:text-stone-100">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-300 font-bold text-base hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-90 transition-all"
                      >
                        +
                      </button>
                    </div>

                    {/* Add to Bag Button */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="flex-grow bg-terracotta hover:bg-[#b04a25] active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-3 min-h-[48px]"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      <span>
                        Add to Bag — <strong>{formatINR(plant.price * quantity)}</strong>
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
