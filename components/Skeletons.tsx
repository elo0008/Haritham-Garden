"use client";

import React from "react";

export function InlineSpinner({
  className = "w-4 h-4 text-current",
  ariaLabel = "Loading...",
}: {
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <svg
      className={`animate-spin motion-reduce:animate-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label={ariaLabel}
      role="status"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function PlantCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-4 flex flex-col justify-between shadow-xs animate-pulse">
      <div className="w-full aspect-square bg-stone-200 dark:bg-stone-800 rounded-2xl mb-4" />
      <div className="space-y-2">
        <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded-lg w-3/4" />
        <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded-lg w-1/2" />
        <div className="h-5 bg-stone-200 dark:bg-stone-800 rounded-lg w-1/3 pt-2" />
      </div>
      <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
        <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded-lg w-1/4" />
        <div className="h-9 w-9 bg-stone-200 dark:bg-stone-800 rounded-full" />
      </div>
    </div>
  );
}

export function PlantGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PlantCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 shadow-xs animate-pulse space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
        <div className="space-y-1.5">
          <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded-lg w-32" />
          <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded-lg w-24" />
        </div>
        <div className="h-6 w-20 bg-stone-200 dark:bg-stone-800 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded-lg w-full" />
        <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded-lg w-4/5" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded-lg w-28" />
        <div className="h-8 w-24 bg-stone-200 dark:bg-stone-800 rounded-xl" />
      </div>
    </div>
  );
}

export function OrderListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function AdminKPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 shadow-xs animate-pulse space-y-3"
        >
          <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded-lg w-24" />
          <div className="h-7 bg-stone-200 dark:bg-stone-800 rounded-lg w-32" />
        </div>
      ))}
    </div>
  );
}

export function DocumentSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse p-6">
      <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded-xl w-2/3" />
      <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded-lg w-full" />
      <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded-lg w-11/12" />
      <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded-lg w-4/5" />
      <div className="h-6 bg-stone-200 dark:bg-stone-800 rounded-xl w-1/3 pt-4" />
      <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded-lg w-full" />
      <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded-lg w-3/4" />
    </div>
  );
}
