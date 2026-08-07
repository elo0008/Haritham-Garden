"use client";

import type { Plant } from "@/lib/types";
import { getEffectivePrice, getPhotoUrl, getPhotoFocalPoint } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Plus } from "lucide-react";

interface PlantCardProps {
  plant: Plant;
  onSelect?: (plant: Plant) => void;
  onQuickAdd?: (plant: Plant) => void;
}

export function PlantCard({ plant, onSelect, onQuickAdd }: PlantCardProps) {
  const isUnavailable = plant.availability === "unavailable";
  const isLimited = plant.availability === "limited";
  const firstPhoto = plant.photos && plant.photos.length > 0 ? plant.photos[0] : null;
  const firstPhotoUrl = getPhotoUrl(firstPhoto);
  const firstPhotoFocalPoint = getPhotoFocalPoint(firstPhoto);
  const primaryTag = plant.tags && plant.tags.length > 0 ? plant.tags[0].name : null;

  const hasSalePrice =
    plant.sale_price !== null &&
    plant.sale_price !== undefined &&
    plant.sale_price < plant.price;
  const effectivePrice = getEffectivePrice(plant);

  return (
    <div
      onClick={() => onSelect?.(plant)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(plant);
        }
      }}
      className={`group bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-xs transition-all duration-300 flex flex-col justify-between ${
        isUnavailable
          ? "opacity-85"
          : "hover:-translate-y-1.5 hover:shadow-xl dark:hover:shadow-stone-950/60 hover:border-stone-300 dark:hover:border-stone-700"
      }`}
    >
      {/* Aspect Square Image Container */}
      <div className="relative overflow-hidden aspect-square bg-stone-100 dark:bg-stone-800 cursor-pointer">
        {/* Tag / Category Badge Top Left */}
        {primaryTag && (
          <span className="absolute top-3 left-3 z-10 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md text-stone-800 dark:text-stone-100 text-xs font-bold px-2.5 py-1 rounded-md shadow-2xs">
            {primaryTag}
          </span>
        )}

        {/* Badges Top Right Container */}
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
          {hasSalePrice && (
            <span className="bg-terracotta text-white backdrop-blur-md text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
              SALE
            </span>
          )}
          {isUnavailable ? (
            <span className="bg-rose-600/90 text-white backdrop-blur-md text-[11px] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
              Out of Stock
            </span>
          ) : isLimited ? (
            <span className="bg-amber-600/90 text-white backdrop-blur-md text-[11px] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              Limited
            </span>
          ) : null}
        </div>

        {firstPhotoUrl ? (
          <img
            src={firstPhotoUrl}
            alt={plant.name}
            style={{ objectPosition: `${firstPhotoFocalPoint.x}% ${firstPhotoFocalPoint.y}%` }}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              isUnavailable ? "grayscale-[30%] opacity-80" : ""
            }`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-stone-100 dark:bg-stone-800 text-stone-300 dark:text-stone-600 text-4xl">
            🌿
          </div>
        )}
      </div>

      {/* Card Content & Action Footer */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100 group-hover:text-botanical-800 dark:group-hover:text-botanical-100 transition-colors">
            {plant.name}
          </h3>
          <p className="text-stone-500 dark:text-stone-400 text-xs mt-1.5 line-clamp-1">
            {plant.description || plant.local_name || "Nursery fresh plant"}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-400 dark:text-stone-500 block font-medium">Price</span>
            {hasSalePrice ? (
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-stone-400 dark:text-stone-500 line-through text-xs font-semibold">
                  {formatINR(plant.price)}
                </span>
                <span
                  className={`font-heading font-bold text-xl ${
                    isUnavailable
                      ? "text-stone-400 dark:text-stone-600 line-through"
                      : "text-terracotta dark:text-terracotta"
                  }`}
                >
                  {formatINR(effectivePrice)}
                </span>
              </div>
            ) : (
              <span
                className={`font-heading font-bold text-xl ${
                  isUnavailable
                    ? "text-stone-400 dark:text-stone-600 line-through"
                    : "text-stone-900 dark:text-stone-100"
                }`}
              >
                {formatINR(plant.price)}
              </span>
            )}
          </div>

          {/* Dedicated + Quick-Add Button */}
          <button
            type="button"
            disabled={isUnavailable}
            onClick={(e) => {
              if (isUnavailable) return;
              e.stopPropagation();
              onQuickAdd?.(plant);
            }}
            className={`p-2.5 rounded-xl font-medium transition-all flex items-center justify-center shadow-2xs min-h-[44px] min-w-[44px] active:scale-90 ${
              isUnavailable
                ? "bg-stone-100 dark:bg-stone-800/50 text-stone-400 dark:text-stone-600 cursor-not-allowed"
                : "bg-botanical-50 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 hover:bg-botanical-800 dark:hover:bg-botanical-600 hover:text-white"
            }`}
            title={isUnavailable ? "Out of stock" : "Add to bag"}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
