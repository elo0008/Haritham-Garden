import { AdminKPISkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans">
      {/* Sticky Header Skeleton */}
      <div className="sticky top-0 z-40 bg-white/85 dark:bg-stone-900/85 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 h-16 sm:h-20 flex items-center justify-between px-4 sm:px-8">
        <div className="h-8 w-44 bg-stone-200 dark:bg-stone-800 rounded-xl animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-stone-200 dark:bg-stone-800 rounded-full animate-pulse" />
          <div className="h-9 w-24 bg-stone-200 dark:bg-stone-800 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center gap-3 overflow-hidden border-b border-stone-200 dark:border-stone-800 pb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-28 bg-stone-200 dark:bg-stone-800 rounded-2xl animate-pulse shrink-0" />
          ))}
        </div>
        <AdminKPISkeleton />
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-xs animate-pulse space-y-4">
          <div className="h-6 w-48 bg-stone-200 dark:bg-stone-800 rounded-xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 w-full bg-stone-200/70 dark:bg-stone-800/60 rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
