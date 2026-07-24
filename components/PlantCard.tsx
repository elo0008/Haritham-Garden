"use client";

import type { Plant } from "@/lib/types";
import { formatINR } from "@/lib/utils";

interface PlantCardProps {
  plant: Plant;
  onSelect?: (plant: Plant) => void;
}

export function PlantCard({ plant, onSelect }: PlantCardProps) {
  const isUnavailable = plant.availability === "unavailable";
  const isLimited = plant.availability === "limited";
  const firstPhoto = plant.photos && plant.photos.length > 0 ? plant.photos[0] : null;

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
      className={`group cursor-pointer flex flex-col transition-all duration-200 min-h-[44px] ${
        isUnavailable ? "opacity-60" : "hover:-translate-y-1 active:translate-y-0"
      }`}
    >
      {/* Image Container — Photo-led Hero */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-stone-200/50 shadow-2xs">
        {firstPhoto ? (
          <img
            src={firstPhoto}
            alt={plant.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-300">
            <svg
              className="h-12 w-12 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </div>
        )}

        {/* Status Badges */}
        {isUnavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs">
            <span className="rounded-full bg-stone-900/85 px-3 py-1 text-xs font-semibold tracking-wide text-white shadow-xs">
              Unavailable
            </span>
          </div>
        )}

        {!isUnavailable && isLimited && (
          <div className="absolute top-2.5 left-2.5">
            <span className="rounded-full bg-[#C1662F] px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-white shadow-xs">
              Limited stock
            </span>
          </div>
        )}
      </div>

      {/* Info Container — Quiet, Minimal */}
      <div className="mt-2.5 flex flex-col px-0.5">
        <h3 className="line-clamp-1 text-sm font-medium text-[#24211E] sm:text-base group-hover:text-[#C1662F] transition-colors">
          {plant.name}
        </h3>
        {plant.local_name && (
          <p className="line-clamp-1 text-xs text-stone-500 font-normal">
            {plant.local_name}
          </p>
        )}
        <p className="mt-1 text-sm font-semibold text-[#24211E]">
          {formatINR(plant.price)}
        </p>
      </div>
    </div>
  );
}
