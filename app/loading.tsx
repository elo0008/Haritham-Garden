import { PlantGridSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans">
      {/* Fixed Header Placeholder */}
      <div className="fixed top-0 left-0 right-0 z-40 h-16 sm:h-20 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-4 sm:px-8">
        <div className="h-8 w-36 bg-stone-200 dark:bg-stone-800 rounded-xl animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-stone-200 dark:bg-stone-800 rounded-full animate-pulse" />
          <div className="h-9 w-9 bg-stone-200 dark:bg-stone-800 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Hero Banner Placeholder */}
      <div className="w-full h-[100svh] bg-stone-200 dark:bg-stone-900 animate-pulse flex flex-col justify-end p-8 sm:p-12 pb-16 transition-colors">
        <div className="max-w-xl space-y-4">
          <div className="h-6 w-28 bg-stone-300 dark:bg-stone-800 rounded-full" />
          <div className="h-10 sm:h-14 w-3/4 bg-stone-300 dark:bg-stone-800 rounded-2xl" />
          <div className="h-4 w-full bg-stone-300 dark:bg-stone-800 rounded-lg" />
          <div className="h-12 w-40 bg-stone-300 dark:bg-stone-800 rounded-full mt-4" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="flex items-center gap-3 mb-8 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-24 bg-stone-200 dark:bg-stone-800 rounded-full animate-pulse shrink-0" />
          ))}
        </div>
        <PlantGridSkeleton count={8} />
      </main>
    </div>
  );
}
